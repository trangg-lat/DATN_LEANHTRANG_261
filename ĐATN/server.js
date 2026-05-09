const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const db = require("./db");

const app = express();

app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = process.env.JWT_SECRET || "supersecret_kho_2026";

function getTokenFromHeader(req) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    return parts[1];
}

function requireAuth(req, res, next) {
    const token = getTokenFromHeader(req);
    if (!token) return res.status(401).json({ message: 'Không có token xác thực.' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
        req.user = decoded;
        next();
    });
}

function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.vai_tro)) {
            return res.status(403).json({ message: 'Không đủ quyền truy cập.' });
        }
        next();
    };
}

function generateToken(user) {
    return jwt.sign({ id: user.id, ten_dang_nhap: user.ten_dang_nhap, vai_tro: user.vai_tro }, JWT_SECRET, {
        expiresIn: '8h'
    });
}

// ==========================================
// 1. 🔑 API ĐĂNG NHẬP
// ==========================================
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT id, ten_dang_nhap, ho_ten, vai_tro, mat_khau FROM nguoi_dung WHERE ten_dang_nhap = ?";

    db.query(sql, [username], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) {
            return res.status(401).json({ message: "Sai tên đăng nhập hoặc mật khẩu!" });
        }

        const user = result[0];
        const passwordMatches = bcrypt.compareSync(password, user.mat_khau);

        if (!passwordMatches) {
            if (password !== user.mat_khau) {
                return res.status(401).json({ message: "Sai tên đăng nhập hoặc mật khẩu!" });
            }
            // Legacy plaintext password migration
            const hashed = bcrypt.hashSync(password, 10);
            db.query("UPDATE nguoi_dung SET mat_khau = ? WHERE id = ?", [hashed, user.id], (err2) => {
                if (err2) console.error('Lỗi cập nhật hash mật khẩu legacy:', err2);
            });
        }

        const payload = { id: user.id, ten_dang_nhap: user.ten_dang_nhap, ho_tro: user.ho_tro, vai_tro: user.vai_tro };
        const token = generateToken(payload);

        res.json({ message: "Đăng nhập thành công", user: payload, token });
    });
});

// Bảo vệ các endpoint sau khi đăng nhập thành công
app.use(requireAuth);

// ==========================================
// 2. 👥 API QUẢN LÝ NGƯỜI DÙNG
// ==========================================
app.get("/nguoi-dung", requireRole(['admin']), (req, res) => {
    db.query("SELECT id, ten_dang_nhap, ho_ten, vai_tro, quyen_xem, quyen_sua, quyen_xoa FROM nguoi_dung", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

app.post("/nguoi-dung", requireRole(['admin']), (req, res) => {
    const { ho_ten, vai_tro, ten_dang_nhap, mat_khau, quyen_xem, quyen_sua, quyen_xoa } = req.body;
    const hashedPassword = bcrypt.hashSync(mat_khau || "", 10);
    const sql = "INSERT INTO nguoi_dung (ho_ten, vai_tro, ten_dang_nhap, mat_khau, quyen_xem, quyen_sua, quyen_xoa) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [ho_ten, vai_tro, ten_dang_nhap, hashedPassword, quyen_xem, quyen_sua, quyen_xoa], (err, result) => {
        if (err) {
            console.error("Lỗi khi thêm người dùng:", err);
            return res.status(500).json({ message: "Lỗi database khi thêm người dùng. Tên đăng nhập có thể đã tồn tại!" });
        }
        res.json({ message: "Thêm người dùng thành công", id: result.insertId });
    });
});

app.put("/nguoi-dung/:id", requireRole(['admin']), (req, res) => {
    const id = req.params.id;
    const { ho_ten, vai_tro, mat_khau, quyen_xem, quyen_sua, quyen_xoa } = req.body;

    const values = [ho_ten, vai_tro, quyen_xem, quyen_sua, quyen_xoa];
    let sql = "UPDATE nguoi_dung SET ho_ten = ?, vai_tro = ?, quyen_xem = ?, quyen_sua = ?, quyen_xoa = ?";

    if (mat_khau && mat_khau.trim().length > 0) {
        const hashedPassword = bcrypt.hashSync(mat_khau, 10);
        sql += ", mat_khau = ?";
        values.push(hashedPassword);
    }

    sql += " WHERE id = ?";
    values.push(id);

    db.query(sql, values, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Cập nhật thông tin người dùng thành công" });
    });
});

app.delete("/nguoi-dung/:id", requireRole(['admin']), (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM nguoi_dung WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Lỗi khi xóa người dùng" });
        res.json({ message: "Xóa nhân viên thành công" });
    });
});

// Route tự cập nhật thông tin cá nhân
app.put("/me", requireAuth, (req, res) => {
    const userId = req.user.id;
    const { mat_khau_cu, mat_khau_moi, ho_ten } = req.body;

    db.query("SELECT mat_khau FROM nguoi_dung WHERE id = ?", [userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ message: "Không tìm thấy người dùng" });

        const user = result[0];
        let updateSql = "UPDATE nguoi_dung SET ho_ten = ?";
        const values = [ho_ten || req.user.ho_ten];

        if (mat_khau_moi) {
            if (!mat_khau_cu) {
                return res.status(400).json({ message: "Vui lòng nhập mật khẩu cũ để đổi mật khẩu mới" });
            }
            const passwordMatches = bcrypt.compareSync(mat_khau_cu, user.mat_khau);
            if (!passwordMatches && mat_khau_cu !== user.mat_khau) {
                return res.status(401).json({ message: "Mật khẩu cũ không đúng!" });
            }
            const hashedPassword = bcrypt.hashSync(mat_khau_moi, 10);
            updateSql += ", mat_khau = ?";
            values.push(hashedPassword);
        }

        updateSql += " WHERE id = ?";
        values.push(userId);

        db.query(updateSql, values, (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ message: "Cập nhật thông tin cá nhân thành công!" });
        });
    });
});

// ==========================================
// 3. 📦 API QUẢN LÝ SẢN PHẨM
// ==========================================
app.get("/san-pham", (req, res) => {
    db.query("SELECT * FROM san_pham ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

app.post("/san-pham", requireRole(['admin', 'quan_ly']), (req, res) => {
    const { ten_san_pham, danh_muc, gia, don_vi } = req.body;
    const gia_decimal = parseFloat(gia) || 0;
    const sql = `INSERT INTO san_pham (ten_san_pham, danh_muc, gia, don_vi) VALUES (?, ?, ?, ?)`;

    db.query(sql, [ten_san_pham, danh_muc, gia_decimal, don_vi || null], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        const newProductId = result.insertId;
        db.query("INSERT INTO ton_kho (san_pham_id, so_luong, vi_tri) VALUES (?, 0, 'Kệ chờ')", [newProductId]);
        res.json({ message: "Thêm thành công", id: newProductId });
    });
});

app.get("/san-pham/:id", (req, res) => {
    const id = req.params.id;
    db.query("SELECT * FROM san_pham WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        res.json(result[0]);
    });
});

app.put("/san-pham/:id", requireRole(['admin', 'quan_ly']), (req, res) => {
    const id = req.params.id;
    const { ten_san_pham, danh_muc, gia, don_vi } = req.body;
    const gia_decimal = parseFloat(gia) || 0;
    const sql = `UPDATE san_pham SET ten_san_pham = ?, danh_muc = ?, gia = ?, don_vi = ? WHERE id = ?`;

    db.query(sql, [ten_san_pham, danh_muc, gia_decimal, don_vi || null, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Cập nhật sản phẩm thành công" });
    });
});

app.delete("/san-pham/:id", requireRole(['admin']), (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM ton_kho WHERE san_pham_id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Lỗi xóa tồn kho" });
        db.query("DELETE FROM san_pham WHERE id = ?", [id], (err2) => {
            if (err2) return res.status(500).json({ message: "Sản phẩm này đã có giao dịch, không thể xóa!" });
            res.json({ message: "Xóa thành công" });
        });
    });
});

// ==========================================
// 4. 🏢 API TỒN KHO & GIAO DỊCH
// ==========================================
app.get("/ton-kho", requireRole(['admin', 'quan_ly', 'nhan_vien']), (req, res) => {
    const sql = `
        SELECT sp.id, sp.ten_san_pham, IFNULL(tk.so_luong, 0) as so_luong, IFNULL(tk.vi_tri, 'Kệ chờ') as vi_tri
        FROM san_pham sp
        LEFT JOIN ton_kho tk ON sp.id = tk.san_pham_id
        ORDER BY tk.so_luong ASC`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

app.post("/nhap-kho", requireRole(['admin', 'quan_ly']), (req, res) => {
    const { san_pham_id, so_luong } = req.body;
    const quantity = Number(so_luong);
    if (!san_pham_id || !quantity || quantity <= 0) return res.status(400).json({ message: "Dữ liệu nhập kho không hợp lệ" });

    db.query("SELECT san_pham_id FROM ton_kho WHERE san_pham_id = ?", [san_pham_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.length === 0) {
            db.query("INSERT INTO ton_kho (san_pham_id, so_luong, vi_tri) VALUES (?, ?, 'Kệ chờ')", [san_pham_id, quantity], (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                db.query("INSERT INTO giao_dich (san_pham_id, loai, so_luong, thoi_gian) VALUES (?, 'nhap', ?, NOW())", [san_pham_id, quantity]);
                res.json({ message: "Nhập kho thành công" });
            });
        } else {
            db.query("UPDATE ton_kho SET so_luong = so_luong + ? WHERE san_pham_id = ?", [quantity, san_pham_id], (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                db.query("INSERT INTO giao_dich (san_pham_id, loai, so_luong, thoi_gian) VALUES (?, 'nhap', ?, NOW())", [san_pham_id, quantity]);
                res.json({ message: "Nhập kho thành công" });
            });
        }
    });
});

app.post("/xuat-kho", requireRole(['admin', 'quan_ly']), (req, res) => {
    const { san_pham_id, so_luong } = req.body;
    const quantity = Number(so_luong);
    if (!san_pham_id || !quantity || quantity <= 0) return res.status(400).json({ message: "Dữ liệu xuất kho không hợp lệ" });

    db.query("SELECT so_luong FROM ton_kho WHERE san_pham_id = ?", [san_pham_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ message: "Sản phẩm không tồn tại trong kho" });
        const currentStock = result[0].so_luong;
        if (currentStock < quantity) return res.status(400).json({ message: "Không đủ tồn kho để xuất" });

        db.query("UPDATE ton_kho SET so_luong = so_luong - ? WHERE san_pham_id = ?", [quantity, san_pham_id], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            db.query("INSERT INTO giao_dich (san_pham_id, loai, so_luong, thoi_gian) VALUES (?, 'xuat', ?, NOW())", [san_pham_id, -quantity]);
            res.json({ message: "Xuất kho thành công" });
        });
    });
});

// --- API NHẬP KHO HÀNG LOẠT ---
app.post("/nhap-kho-hang-loat", requireRole(['admin', 'quan_ly']), (req, res) => {
    const { items, supplier_id } = req.body;
    if (!items || !Array.isArray(items)) return res.status(400).json({ message: "Dữ liệu không hợp lệ" });

    let completed = 0;
    let errors = [];

    items.forEach(item => {
        const { san_pham_id, so_luong } = item;
        db.query("UPDATE ton_kho SET so_luong = so_luong + ? WHERE san_pham_id = ?", [so_luong, san_pham_id], (err) => {
            if (err) {
                errors.push({ id: san_pham_id, error: err.message });
            } else {
                db.query("INSERT INTO giao_dich (san_pham_id, loai, so_luong, thoi_gian) VALUES (?, 'nhap', ?, NOW())", [san_pham_id, so_luong]);
            }
            completed++;
            if (completed === items.length) {
                if (errors.length > 0) return res.status(500).json({ message: "Một số sản phẩm gặp lỗi khi nhập kho", errors });
                res.json({ message: "Nhập kho hàng loạt thành công" });
            }
        });
    });
});

// --- API XUẤT KHO HÀNG LOẠT ---
app.post("/xuat-kho-hang-loat", requireRole(['admin', 'quan_ly']), (req, res) => {
    const { items, customer_id } = req.body;
    if (!items || !Array.isArray(items)) return res.status(400).json({ message: "Dữ liệu không hợp lệ" });

    let completed = 0;
    let errors = [];

    items.forEach(item => {
        const { san_pham_id, so_luong_xuat } = item;
        if (!san_pham_id || !so_luong_xuat || so_luong_xuat <= 0) {
            errors.push({ id: san_pham_id, error: "Số lượng xuất không hợp lệ" });
            completed++;
            if (completed === items.length) {
                return res.status(400).json({ message: "Dữ liệu xuất kho hàng loạt không hợp lệ", errors });
            }
            return;
        }

        db.query("SELECT so_luong FROM ton_kho WHERE san_pham_id = ?", [san_pham_id], (err, result) => {
            if (err) {
                errors.push({ id: san_pham_id, error: err.message });
                completed++;
                if (completed === items.length) {
                    return res.status(500).json({ message: "Một số sản phẩm gặp lỗi khi xuất kho", errors });
                }
                return;
            }

            if (result.length === 0) {
                errors.push({ id: san_pham_id, error: "Sản phẩm không tồn tại trong kho" });
                completed++;
                if (completed === items.length) {
                    return res.status(404).json({ message: "Một số sản phẩm không tồn tại", errors });
                }
                return;
            }

            const currentStock = result[0].so_luong;
            if (currentStock < so_luong_xuat) {
                errors.push({ id: san_pham_id, error: "Không đủ tồn kho" });
                completed++;
                if (completed === items.length) {
                    return res.status(400).json({ message: "Một số sản phẩm không đủ tồn kho", errors });
                }
                return;
            }

            db.query("UPDATE ton_kho SET so_luong = so_luong - ? WHERE san_pham_id = ?", [so_luong_xuat, san_pham_id], (err2) => {
                if (err2) {
                    errors.push({ id: san_pham_id, error: err2.message });
                } else {
                    db.query("INSERT INTO giao_dich (san_pham_id, loai, so_luong, thoi_gian) VALUES (?, 'xuat', ?, NOW())", [san_pham_id, -so_luong_xuat]);
                }
                completed++;
                if (completed === items.length) {
                    if (errors.length > 0) return res.status(500).json({ message: "Một số sản phẩm gặp lỗi khi xuất kho", errors });
                    res.json({ message: "Xuất kho hàng loạt thành công" });
                }
            });
        });
    });
});

// ==========================================
// 4.5. 🗺️ API QUẢN LÝ VỊ TRÍ (MỚI)
// ==========================================
app.get("/vi-tri", requireRole(['admin', 'quan_ly', 'nhan_vien']), (req, res) => {
    db.query("SELECT * FROM vi_tri_kho ORDER BY ten_vi_tri", (err, result) => {
        if (err) {
            // Nếu chưa có bảng thì tạo tự động (phòng trường hợp người dùng chưa chạy SQL)
            db.query("CREATE TABLE IF NOT EXISTS vi_tri_kho (id INT AUTO_INCREMENT PRIMARY KEY, ten_vi_tri VARCHAR(100), mo_ta VARCHAR(255))", (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                return res.json([]);
            });
        } else {
            res.json(result);
        }
    });
});

app.post("/vi-tri", requireRole(['admin', 'quan_ly']), (req, res) => {
    const { ten_vi_tri, mo_ta } = req.body;
    db.query("INSERT INTO vi_tri_kho (ten_vi_tri, mo_ta) VALUES (?, ?)", [ten_vi_tri, mo_ta], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Thêm vị trí thành công", id: result.insertId });
    });
});

app.delete("/vi-tri/:id", requireRole(['admin']), (req, res) => {
    db.query("DELETE FROM vi_tri_kho WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "Lỗi xóa vị trí" });
        res.json({ message: "Xóa thành công" });
    });
});

// ==========================================
// 4.6. 🚚 API CHUYỂN KHO NỘI BỘ (MỚI)
// ==========================================
app.post("/chuyen-kho", requireRole(['admin', 'quan_ly']), (req, res) => {
    const { san_pham_id, vi_tri_moi } = req.body;
    db.query("UPDATE ton_kho SET vi_tri = ? WHERE san_pham_id = ?", [vi_tri_moi, san_pham_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query("INSERT INTO giao_dich (san_pham_id, loai, so_luong, thoi_gian) VALUES (?, 'chuyen_kho', 0, NOW())", [san_pham_id]);
        res.json({ message: "Chuyển kho thành công sang " + vi_tri_moi });
    });
});

// ==========================================
// 4.7. 📋 API KIỂM KÊ / ĐIỀU CHỈNH (MỚI)
// ==========================================
app.post("/kiem-ke", requireRole(['admin', 'quan_ly']), (req, res) => {
    const { san_pham_id, so_luong_thuc_te, ghi_chu } = req.body;
    
    db.query("SELECT so_luong FROM ton_kho WHERE san_pham_id = ?", [san_pham_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ message: "Sản phẩm không có trong kho" });

        const so_luong_cu = result[0].so_luong;
        const chenh_lech = so_luong_thuc_te - so_luong_cu;

        db.query("UPDATE ton_kho SET so_luong = ? WHERE san_pham_id = ?", [so_luong_thuc_te, san_pham_id], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            
            db.query("INSERT INTO giao_dich (san_pham_id, loai, so_luong, thoi_gian) VALUES (?, 'adjust', ?, NOW())", [san_pham_id, chenh_lech]);
            res.json({ 
                message: "Kiểm kê thành công", 
                chenh_lech: chenh_lech,
                ghi_chu: ghi_chu
            });
        });
    });
});

// ==========================================
// 5. 🤝 API NHÀ CUNG CẤP (MỚI THÊM)
// ==========================================
app.get("/nha-cung-cap", requireRole(['admin', 'quan_ly', 'nhan_vien']), (req, res) => {
    db.query("SELECT * FROM nha_cung_cap ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

app.post("/nha-cung-cap", requireRole(['admin', 'quan_ly']), (req, res) => {
    const { ten_ncc, lien_he, dia_chi } = req.body;
    const sql = "INSERT INTO nha_cung_cap (ten_ncc, lien_he, dia_chi) VALUES (?, ?, ?)";
    db.query(sql, [ten_ncc, lien_he, dia_chi], (err, result) => {
        if (err) return res.status(500).json({ message: "Lỗi database khi thêm NCC" });
        res.json({ message: "Thêm NCC thành công", id: result.insertId });
    });
});

// ==========================================
// 6. 📜 API LỊCH SỬ GIAO DỊCH (CHO AI)
// ==========================================
app.get("/lich-su-giao-dich", requireRole(['admin', 'quan_ly']), (req, res) => {
    const sql = `
        SELECT gd.*, sp.ten_san_pham
        FROM giao_dich gd
        JOIN san_pham sp ON gd.san_pham_id = sp.id
        ORDER BY gd.thoi_gian DESC
        LIMIT 500`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

// ==========================================
// 7. 📊 API THỐNG KÊ (DÀNH CHO DASHBOARD)
// ==========================================
app.get("/dashboard-stats", requireRole(['admin', 'quan_ly', 'nhan_vien']), (req, res) => {
    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM san_pham) as tongSanPham,
            (SELECT SUM(so_luong) FROM ton_kho) as tongTonKho,
            (SELECT COUNT(*) FROM ton_kho WHERE so_luong < 10) as sapHetHang,
            (SELECT COUNT(*) FROM nha_cung_cap) as doiTac
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result[0]);
    });
});

// ==========================================
// 8. ⏰ TỰ ĐỘNG CHỤP SNAPSHOT TỒN KHO EOD (End Of Day)
// ==========================================
cron.schedule('59 23 * * *', () => {
    console.log('📦 [CRON] Bắt đầu chụp Snapshot tồn kho EOD...');
    const sql = `
        INSERT INTO inventory_snapshots (san_pham_id, so_luong, ngay_snapshot)
        SELECT san_pham_id, so_luong, CURDATE() FROM ton_kho
    `;
    db.query(sql, (err) => {
        if (err) console.error('Lỗi khi chụp snapshot EOD:', err.message);
        else console.log('✅ [CRON] Chụp Snapshot tồn kho EOD thành công!');
    });
});

// Khởi chạy server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 SERVER READY: http://localhost:${PORT}`);
});