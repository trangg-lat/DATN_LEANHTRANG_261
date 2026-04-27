const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ==========================================
// 🛡️ DATABASE CONNECTION (Integrated from old db.js)
// ==========================================
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "123456",
    database: "quanly_kho"
};

let db;

function handleDisconnect() {
    db = mysql.createConnection(dbConfig); 

    db.connect((err) => {
        if (err) {
            console.error('❌ Lỗi kết nối Database:', err);
            setTimeout(handleDisconnect, 2000); // Thử lại sau 2 giây
        } else {
            console.log('✅ Kết nối Database MySQL thành công!');
        }
    });

    db.on('error', (err) => {
        console.error('⚠️ Lỗi Database (on error):', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();

// ==========================================
// 🔑 1. API ĐĂNG NHẬP
// ==========================================
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT id, ten_dang_nhap, ho_ten, vai_tro FROM nguoi_dung WHERE ten_dang_nhap = ? AND mat_khau = ?";
    
    db.query(sql, [username, password], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length > 0) {
            res.json({ message: "Đăng nhập thành công", user: result[0] });
        } else {
            res.status(401).json({ message: "Sai tên đăng nhập hoặc mật khẩu!" });
        }
    });
});

// ==========================================
// 👥 2. API QUẢN LÝ NGƯỜI DÙNG
// ==========================================
app.get("/nguoi-dung", (req, res) => {
    db.query("SELECT id, ten_dang_nhap, ho_ten, vai_tro, quyen_xem, quyen_sua, quyen_xoa FROM nguoi_dung", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

app.post("/nguoi-dung", (req, res) => {
    const { ho_ten, vai_tro, ten_dang_nhap, mat_khau, quyen_xem, quyen_sua, quyen_xoa } = req.body;
    const sql = "INSERT INTO nguoi_dung (ho_ten, vai_tro, ten_dang_nhap, mat_khau, quyen_xem, quyen_sua, quyen_xoa) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [ho_ten, vai_tro, ten_dang_nhap, mat_khau, quyen_xem, quyen_sua, quyen_xoa], (err, result) => {
        if (err) {
            console.error("Lỗi khi thêm người dùng:", err);
            return res.status(500).json({ message: "Lỗi database khi thêm người dùng. Tên đăng nhập có thể đã tồn tại!" });
        }
        res.json({ message: "Thêm người dùng thành công", id: result.insertId });
    });
});

app.delete("/nguoi-dung/:id", (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM nguoi_dung WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Lỗi khi xóa người dùng" });
        res.json({ message: "Xóa nhân viên thành công" });
    });
});

// ==========================================
// 📦 3. API QUẢN LÝ SẢN PHẨM
// ==========================================
app.get("/san-pham", (req, res) => {
    db.query("SELECT * FROM san_pham ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

app.post("/san-pham", (req, res) => {
    const { ten_san_pham, danh_muc, gia } = req.body;
    const gia_decimal = parseFloat(gia) || 0;
    const sql = `INSERT INTO san_pham (ten_san_pham, danh_muc, gia) VALUES (?, ?, ?)`;
    
    db.query(sql, [ten_san_pham, danh_muc, gia_decimal], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        const newProductId = result.insertId;
        db.query("INSERT INTO ton_kho (san_pham_id, so_luong, vi_tri) VALUES (?, 0, 'Kệ chờ')", [newProductId]);
        res.json({ message: "Thêm thành công", id: newProductId });
    });
});

app.delete("/san-pham/:id", (req, res) => {
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
// 🏢 4. API TỒN KHO & GIAO DỊCH
// ==========================================
app.get("/ton-kho", (req, res) => {
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

app.post("/nhap-kho", (req, res) => {
    const { san_pham_id, so_luong } = req.body;
    db.query("UPDATE ton_kho SET so_luong = so_luong + ? WHERE san_pham_id = ?", [so_luong, san_pham_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query("INSERT INTO giao_dich (san_pham_id, loai, so_luong, ngay_gd) VALUES (?, 'nhap', ?, NOW())", [san_pham_id, so_luong]);
        res.json({ message: "Nhập kho thành công" });
    });
});

app.post("/nhap-kho-hang-loat", (req, res) => {
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
                db.query("INSERT INTO giao_dich (san_pham_id, loai, so_luong, ngay_gd) VALUES (?, 'nhap', ?, NOW())", [san_pham_id, so_luong]);
            }
            completed++;
            if (completed === items.length) {
                if (errors.length > 0) return res.status(500).json({ message: "Một số sản phẩm gặp lỗi", errors });
                res.json({ message: "Nhập hàng loạt thành công" });
            }
        });
    });
});

app.post("/xuat-kho-hang-loat", (req, res) => {
    const { items, customer_id } = req.body;
    if (!items || !Array.isArray(items)) return res.status(400).json({ message: "Dữ liệu không hợp lệ" });

    let completed = 0;
    let errors = [];

    items.forEach(item => {
        const { san_pham_id, so_luong_xuat } = item;
        db.query("UPDATE ton_kho SET so_luong = so_luong - ? WHERE san_pham_id = ?", [so_luong_xuat, san_pham_id], (err) => {
            if (err) {
                errors.push({ id: san_pham_id, error: err.message });
            } else {
                db.query("INSERT INTO giao_dich (san_pham_id, loai, so_luong, ngay_gd) VALUES (?, 'xuat', ?, NOW())", [san_pham_id, -so_luong_xuat]);
            }
            completed++;
            if (completed === items.length) {
                if (errors.length > 0) return res.status(500).json({ message: "Một số sản phẩm gặp lỗi", errors });
                res.json({ message: "Xuất hàng loạt thành công" });
            }
        });
    });
});

// ==========================================
// 🤝 5. API NHÀ CUNG CẤP & DASHBOARD
// ==========================================
app.get("/nha-cung-cap", (req, res) => {
    db.query("SELECT * FROM nha_cung_cap ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

app.get("/dashboard-stats", (req, res) => {
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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 UNIFIED SERVER READY: http://localhost:${PORT}`);
});
