import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Box, Warehouse, ArrowDownCircle,
  ArrowUpCircle, ClipboardCheck, BrainCircuit,
  BarChart3, BarChart2, LogOut, UserCircle, Users, Edit, Trash2,
  ShoppingCart, AlertTriangle, FileSpreadsheet, FileText,
  Search, ArrowLeft, CheckCircle2, Plus, PlusCircle, Save,
  TrendingUp, Loader2, Sparkles, PackageCheck, PackageMinus, PackageX,
  ArrowRightCircle, MapPin, ClipboardList, Settings2
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import "./App.css";

const API = "http://localhost:3000"; // URL Backend Node.js
// const API = "https://eleven-clowns-wink.loca.lt"; // Public URL via localtunnel
const AI_API = "http://localhost:5000"; // AI server địa phương
const lineDataSample = [
  { name: '1/10', uv: 200 }, { name: '15/10', uv: 300 }, { name: '30/10', uv: 400 }
];
const barDataSample = [
  { name: 'T2', nhap: 120, xuat: 80 }, { name: 'T3', nhap: 150, xuat: 100 }
];

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleString('vi-VN', { hour12: false });
}

function downloadCsv(filename, headers, rows) {
  const csvRows = [headers.join(','), ...rows.map(row => headers.map(header => {
    const value = row[header] ?? '';
    const text = typeof value === 'string' ? value.replace(/"/g, '""') : value;
    return `"${text}"`;
  }).join(','))];

  const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function calculateAbcXyzSummary(products, stock, history) {
  const items = products.map(product => ({
    ...product,
    totalVolume: 0,
    transactionCount: 0
  }));
  const byId = new Map(items.map(item => [item.id, item]));

  if (Array.isArray(history)) {
    history.forEach(tx => {
      const item = byId.get(tx.san_pham_id);
      if (item) {
        item.totalVolume += Math.abs(Number(tx.so_luong) || 0);
        item.transactionCount += 1;
      }
    });
  }

  items.forEach(item => {
    if (item.totalVolume === 0) {
      const stockItem = stock.find(s => s.id === item.id);
      item.totalVolume = stockItem ? Number(stockItem.so_luong || 0) : 0;
    }
  });

  const sorted = [...items].sort((a, b) => b.totalVolume - a.totalVolume);
  const totalCount = sorted.length;
  const aCount = Math.max(1, Math.ceil(totalCount * 0.2));
  const bCount = Math.max(1, Math.ceil(totalCount * 0.3));

  let abc = { A: 0, B: 0, C: 0 };
  let xyz = { X: 0, Y: 0, Z: 0 };

  sorted.forEach((item, idx) => {
    if (idx < aCount) abc.A += 1;
    else if (idx < aCount + bCount) abc.B += 1;
    else abc.C += 1;

    if (item.transactionCount >= 6) xyz.X += 1;
    else if (item.transactionCount >= 3) xyz.Y += 1;
    else xyz.Z += 1;
  });

  return { ...abc, ...xyz };
}

// --- THÀNH PHẦN TOP HEADER CHUNG ---
function TopHeader({ user, onProfileClick }) {
  return (
    <header className="top-header">
      <div className="header-left">
        <Warehouse size={24} color="white" />
        <span className="header-brand">WAREHOUSE MANAGER</span>
        <span className="header-nav-item">Kho lưu trữ nội bộ</span>
      </div>
      <div className="header-right">
        <div className="icon-badge-wrapper"><Box size={20} /></div>
        <div className="icon-badge-wrapper"><ClipboardCheck size={20} /></div>
        <div className="icon-badge-wrapper">
          <span className="notification-dot"></span>
          <BrainCircuit size={20} />
        </div>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '20px' }} onClick={onProfileClick}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{user.ho_ten}</span>
            <UserCircle size={28} />
          </div>
        ) : (
          <UserCircle size={28} />
        )}
      </div>
    </header>
  );
}

function ProfileModal({ user, onClose, apiFetch }) {
  const [hoTen, setHoTen] = useState(user.ho_ten);
  const [matKhauCu, setMatKhauCu] = useState("");
  const [matKhauMoi, setMatKhauMoi] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ho_ten: hoTen };
      if (matKhauMoi) {
        if (!matKhauCu) return alert("Vui lòng nhập mật khẩu cũ!");
        payload.mat_khau_cu = matKhauCu;
        payload.mat_khau_moi = matKhauMoi;
      }
      await apiFetch(`${API}/me`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      alert("Cập nhật thông tin thành công!");

      // Update local storage user name
      const storedUser = JSON.parse(localStorage.getItem('user'));
      storedUser.ho_ten = hoTen;
      localStorage.setItem('user', JSON.stringify(storedUser));
      window.location.reload();
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ width: '400px', background: '#1e1e2d', padding: '24px' }}>
        <h3 style={{ marginTop: 0, color: 'white' }}>Thông tin cá nhân</h3>
        <form onSubmit={handleSubmit}>
          <div className="input-group-um" style={{ marginBottom: '15px' }}>
            <label>Họ Tên</label>
            <input type="text" value={hoTen} onChange={e => setHoTen(e.target.value)} required />
          </div>
          <div className="input-group-um" style={{ marginBottom: '15px' }}>
            <label>Mật Khẩu Cũ (nếu muốn đổi MK)</label>
            <input type="password" value={matKhauCu} onChange={e => setMatKhauCu(e.target.value)} />
          </div>
          <div className="input-group-um" style={{ marginBottom: '20px' }}>
            <label>Mật Khẩu Mới</label>
            <input type="password" value={matKhauMoi} onChange={e => setMatKhauMoi(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="confirm-btn">Lưu thay đổi</button>
            <button type="button" className="secondary-btn" onClick={onClose}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  // Lấy thông tin user/token từ localStorage để tránh mất dữ liệu khi refresh trang (F5)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);

  const apiFetch = async (url, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
      handleLogout();
      throw new Error("Phiên đăng nhập hết hạn hoặc không có quyền truy cập.");
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || "Lỗi kết nối API");
    }
    return data;
  };

  const handleLogin = async (username, password) => {
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Lỗi kết nối server!");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const [showProfile, setShowProfile] = useState(false);

  return (
    <Router>
      <div className="font-sans antialiased">
        <TopHeader user={user} onProfileClick={() => setShowProfile(true)} />
        {showProfile && user && <ProfileModal user={user} onClose={() => setShowProfile(false)} apiFetch={apiFetch} />}
        {!user ? (
          <div className="login-page-container">
            <Routes>
              <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
            </Routes>
          </div>
        ) : (
          <div className="app-container">
            {/* --- SIDEBAR --- */}
            <aside className="sidebar">
              <div className="logo">📦 KHO THÔNG MINH</div>
              <div className="user-info">
                <UserCircle size={30} color="#818cf8" />
                <div>
                  <p className="user-name">{user.ho_ten}</p>
                  <p className="user-role-badge">{(user.vai_tro || "").toUpperCase()}</p>
                </div>
              </div>
              <nav className="sidebar-nav">
                <Link to="/"><LayoutDashboard size={20} /> Dashboard</Link>

                {/* Phân quyền Menu */}
                {(user.vai_tro === "admin" || user.vai_tro === "quan_ly") && (
                  <Link to="/san-pham"><Box size={20} /> Sản phẩm</Link>
                )}
                {user.vai_tro === "admin" && (
                  <Link to="/nguoi-dung"><Users size={20} /> Người dùng</Link>
                )}

                <Link to="/ton-kho"><Warehouse size={20} /> Kho</Link>
                <Link to="/nhap-kho"><ArrowDownCircle size={20} /> Nhập kho</Link>
                <Link to="/xuat-kho"><ArrowUpCircle size={20} /> Xuất kho</Link>
                <Link to="/chuyen-kho"><ArrowRightCircle size={20} /> Chuyển kho</Link>
                <Link to="/kiem-ke"><ClipboardCheck size={20} /> Kiểm kê</Link>
                {(user.vai_tro === 'admin' || user.vai_tro === 'quan_ly') && (
                  <>
                    <Link to="/vi-tri"><Warehouse size={20} /> Vị trí kệ</Link>
                    <Link to="/lich-su-giao-dich"><ClipboardCheck size={20} /> Lịch sử giao dịch</Link>
                  </>
                )}

                <button onClick={handleLogout} className="btn-logout">
                  <LogOut size={20} /> Đăng xuất
                </button>
              </nav>
            </aside>

            {/* --- NỘI DUNG CHÍNH --- */}
            <main className="content">
              <Routes>
                <Route path="/" element={<Dashboard user={user} apiFetch={apiFetch} />} />

                <Route path="/san-pham" element={<SanPhamManager user={user} apiFetch={apiFetch} />} />
                <Route path="/ton-kho" element={<TonKhoManager user={user} apiFetch={apiFetch} />} />
                <Route path="/nhap-kho" element={<NhapKhoManager user={user} apiFetch={apiFetch} />} />
                {(user.vai_tro === 'admin' || user.vai_tro === 'quan_ly') && (
                  <Route path="/lich-su-giao-dich" element={<LichSuGiaoDich apiFetch={apiFetch} />} />
                )}
                <Route path="/nguoi-dung" element={user.vai_tro === "admin" ? <UserManager user={user} apiFetch={apiFetch} /> : <Navigate to="/" />} />
                <Route path="/xuat-kho" element={<XuatKhoManager user={user} apiFetch={apiFetch} />} />
                <Route path="/chuyen-kho" element={<ChuyenKhoManager user={user} apiFetch={apiFetch} />} />
                <Route path="/kiem-ke" element={<KiemKeManager user={user} apiFetch={apiFetch} />} />
                <Route path="/vi-tri" element={<LocationManager user={user} apiFetch={apiFetch} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        )}
      </div>
    </Router>
  );
}

// --- LOGIN PAGE ---
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="login-wrapper">
      <div className="login-box">
        <div className="login-header">
          <Warehouse size={56} color="#1d4ed8" />
          <div className="login-header-text">
            <h1>WAREHOUSE</h1>
            <p>MANAGER</p>
          </div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(username, password); }} className="login-form">
          <div className="input-group">
            <UserCircle size={20} color="#94a3b8" />
            <input type="text" placeholder="Email" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="input-group">
            <span style={{ color: '#94a3b8', fontSize: '16px' }}>🔒</span>
            <input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary login-btn">Đăng Nhập</button>
          <a href="#" className="forgot-password">Quên mật khẩu?</a>
        </form>
      </div>
    </div>
  );
}

// --- QUẢN LÝ SẢN PHẨM ---
function SanPhamManager({ user, apiFetch }) {
  const [list, setList] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [form, setForm] = useState({ ten_san_pham: "", danh_muc: "", gia: "", don_vi: "" });

  const fetchAll = async () => {
    try {
      const data = await apiFetch(`${API}/san-pham`);
      setList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
      alert(error.message);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Hàm tải dữ liệu sản phẩm trước khi sửa
  const handleEditProduct = async (id) => {
    try {
      const data = await apiFetch(`${API}/san-pham/${id}`);
      setForm({
        ten_san_pham: data.ten_san_pham || "",
        danh_muc: data.danh_muc || "",
        gia: data.gia || "",
        don_vi: data.don_vi || ""
      });
      setIsEditing(id);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;

    try {
      await apiFetch(`${API}/san-pham/${id}`, { method: "DELETE" });
      fetchAll();
    } catch (error) {
      alert("Lỗi: " + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `${API}/san-pham/${isEditing}` : `${API}/san-pham`;
    try {
      await apiFetch(url, {
        method,
        body: JSON.stringify(form)
      });
      setForm({ ten_san_pham: "", danh_muc: "", gia: "", don_vi: "" });
      setIsEditing(null);
      fetchAll();
    } catch (error) {
      alert("Không thể lưu sản phẩm: " + error.message);
    }
  };

  return (
    <div className="fade-in">
      <header className="content-header">
        <h2>Quản lý sản phẩm</h2>
      </header>

      <div className="manager-layout">
        {/* --- FORM NHẬP LIỆU --- */}
        <form className="glass-card product-form" onSubmit={handleSubmit}>
          <h4>{isEditing ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h4>

          <div className="input-row">
            <input
              placeholder="Tên sản phẩm"
              value={form.ten_san_pham}
              onChange={e => setForm({ ...form, ten_san_pham: e.target.value })}
              required
            />
            <input
              placeholder="Danh mục"
              value={form.danh_muc}
              onChange={e => setForm({ ...form, danh_muc: e.target.value })}
            />
            <input
              placeholder="Đơn vị (vd: Cái, Thùng...)"
              value={form.don_vi}
              onChange={e => setForm({ ...form, don_vi: e.target.value })}
            />
            <input
              placeholder="Giá bán"
              type="number"
              value={form.gia}
              onChange={e => setForm({ ...form, gia: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="confirm-btn">
            {isEditing ? "Cập nhật thay đổi" : "Lưu sản phẩm"}
          </button>

          {isEditing && (
            <button
              type="button"
              className="btn-cancel"
              onClick={() => { setIsEditing(null); setForm({ ten_san_pham: "", danh_muc: "", gia: "", don_vi: "" }); }}
            >
              Hủy chỉnh sửa
            </button>
          )}
        </form>

        {/* --- BẢNG DANH SÁCH --- */}
        <div className="glass-card scroll-table">
          <table>
            <thead>
              <tr>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Đơn vị</th>
                <th>Giá</th>
                <th>Phân loại ABC</th>
                {user.vai_tro === "admin" && <th>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {list.map(item => (
                <tr key={item.id}>
                  <td className="font-medium">{item.ten_san_pham}</td>
                  <td className="text-muted">{item.danh_muc}</td>
                  <td className="text-muted">{item.don_vi}</td>
                  <td className="text-muted font-bold text-blue-600">{Number(item.gia).toLocaleString()}đ</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      background: item.phan_loai_abc === 'A' ? 'rgba(34,197,94,0.2)' : item.phan_loai_abc === 'B' ? 'rgba(250,204,21,0.2)' : 'rgba(148,163,184,0.2)',
                      color: item.phan_loai_abc === 'A' ? '#4ade80' : item.phan_loai_abc === 'B' ? '#facc15' : '#94a3b8',
                      padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold'
                    }}>
                      {item.phan_loai_abc || 'C'}
                    </span>
                  </td>
                  {user.vai_tro === "admin" && (
                    <td className="actions">
                      <button className="edit-btn" title="Sửa" onClick={() => { setForm(item); setIsEditing(item.id); }}>
                        <Edit size={16} />
                      </button>
                      <button className="delete-btn" title="Xóa" onClick={() => handleDeleteProduct(item.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
              Chưa có sản phẩm nào trong danh sách.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- QUẢN LÝ TỒN KHO ---
function TonKhoManager({ user, apiFetch }) {
  const [list, setList] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockForm, setStockForm] = useState({ san_pham_id: "", so_luong: "", loai: "nhap" });

  const fetchStock = async () => {
    try {
      const data = await apiFetch(`${API}/ton-kho`);
      setList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };
  const fetchProducts = async () => {
    try {
      const data = await apiFetch(`${API}/san-pham`);
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  useEffect(() => { fetchStock(); fetchProducts(); }, []);

  const handleStockAction = async (e) => {
    e.preventDefault();
    const endpoint = stockForm.loai === "nhap" ? "nhap-kho" : "xuat-kho";
    try {
      await apiFetch(`${API}/${endpoint}`, {
        method: "POST",
        body: JSON.stringify({ san_pham_id: stockForm.san_pham_id, so_luong: Number(stockForm.so_luong) })
      });
      setStockForm({ ...stockForm, so_luong: "" });
      fetchStock();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="fade-in">
      <header className="content-header">
        <h2>Quản lý tồn kho</h2>
      </header>

      <div className="manager-layout">
        <form className="glass-card transaction-form" onSubmit={handleStockAction}>
          <h4>Giao dịch kho</h4>

          <div className="input-group-stock">
            <select
              value={stockForm.san_pham_id}
              onChange={e => setStockForm({ ...stockForm, san_pham_id: e.target.value })}
              required
            >
              <option value="">Chọn sản phẩm</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.ten_san_pham}</option>)}
            </select>
            <input
              type="number"
              placeholder="Số lượng"
              value={stockForm.so_luong}
              onChange={e => setStockForm({ ...stockForm, so_luong: e.target.value })}
              required
            />
          </div>

          <div className="row-selector">
            <button
              type="button"
              className={stockForm.loai === 'nhap' ? 'active' : ''}
              onClick={() => setStockForm({ ...stockForm, loai: 'nhap' })}
            >
              <ArrowDownCircle size={16} /> Nhập
            </button>
            <button
              type="button"
              className={stockForm.loai === 'xuat' ? 'active' : ''}
              onClick={() => setStockForm({ ...stockForm, loai: 'xuat' })}
            >
              <ArrowUpCircle size={16} /> Xuất
            </button>
          </div>

          <button type="submit" className="btn-base btn-primary">Xác nhận giao dịch</button>
        </form>

        <div className="glass-card scroll-table">
          <table>
            <thead>
              <tr><th>Sản phẩm</th><th>Hiện có</th><th>Vị trí</th></tr>
            </thead>
            <tbody>
              {list.map(item => (
                <tr key={item.id}>
                  <td className="font-medium">{item.ten_san_pham}</td>
                  <td><span className="stock-count">{item.so_luong}</span></td>
                  <td>{item.vi_tri || "Kệ A1"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- NHẬP KHO MANAGER ---
function NhapKhoManager({ user, apiFetch }) {
  const [products, setProducts] = useState([]);
  const [supplier, setSupplier] = useState("");
  const [items, setItems] = useState([
    { id: Date.now(), san_pham_id: "", so_luong: 1, don_gia: 0 }
  ]);

  const [suppliers, setSuppliers] = useState([]);

  const fetchProducts = async () => {
    try {
      const data = await apiFetch(`${API}/san-pham`);
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };
  const fetchSuppliers = async () => {
    try {
      const data = await apiFetch(`${API}/nha-cung-cap`);
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), san_pham_id: "", so_luong: 1, don_gia: 0 }]);
  };

  const handleRemoveItem = (id) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleAddSupplier = async () => {
    const ten_ncc = window.prompt("Nhập tên Nhà Cung Cấp mới:");
    if (!ten_ncc) return;
    const lien_he = window.prompt("Nhập Số điện thoại/Liên hệ (có thể bỏ qua):");
    const dia_chi = window.prompt("Nhập Địa chỉ (có thể bỏ qua):");

    try {
      await apiFetch(`${API}/nha-cung-cap`, {
        method: "POST",
        body: JSON.stringify({ ten_ncc, lien_he, dia_chi })
      });
      fetchSuppliers();
      alert("Đã thêm Nhà cung cấp mới thành công!");
    } catch (err) {
      alert("Không thể thêm nhà cung cấp: " + err.message);
    }
  };

  const handleSubmit = async () => {
    if (!supplier) return alert("Vui lòng chọn nhà cung cấp!");
    if (items.some(i => !i.san_pham_id || i.so_luong <= 0)) {
      return alert("Vui lòng chọn sản phẩm và số lượng hợp lệ cho tất cả các dòng!");
    }

    try {
      await apiFetch(`${API}/nhap-kho-hang-loat`, {
        method: "POST",
        body: JSON.stringify({ items, supplier_id: supplier })
      });
      alert("Đã lưu thông tin nhập kho thành công!");
      setItems([{ id: Date.now(), san_pham_id: "", so_luong: 1, don_gia: 0 }]);
      setSupplier("");
    } catch (error) {
      alert("Lỗi: " + error.message);
    }
  };

  return (
    <div className="fade-in nhapkho-container">
      <div className="nk-header">
        <h2>Nhập Kho</h2>
        <div className="nk-top-actions">
          <button className="nk-btn-outline"><FileSpreadsheet size={18} /> Nhập Lô</button>
          <button className="nk-btn-outline variant-blue"><Save size={18} /> Lưu Nháp</button>
        </div>
      </div>

      <div className="nk-card">
        <div className="nk-supplier-row">
          <select
            className="nk-select"
            style={{ maxWidth: '400px' }}
            value={supplier}
            onChange={e => setSupplier(e.target.value)}
          >
            <option value="">-- Chọn Nhà Cung Cấp --</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.ten_ncc}</option>
            ))}
          </select>
          <button
            className="nk-btn-outline btn-add-supplier"
            onClick={handleAddSupplier}
          >
            <PlusCircle size={18} /> Thêm Mới
          </button>
        </div>

        <table className="nk-table">
          <thead>
            <tr>
              <th style={{ width: '35%' }}>Sản Phẩm</th>
              <th style={{ width: '15%' }}>Số Lượng</th>
              <th style={{ width: '10%' }}>ĐVT</th>
              <th style={{ width: '20%' }}>Đơn Giá (VNĐ)</th>
              <th style={{ width: '20%', textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <select
                    className="nk-select"
                    value={item.san_pham_id}
                    onChange={e => handleItemChange(item.id, 'san_pham_id', e.target.value)}
                  >
                    <option value="">Chọn sản phẩm</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.ten_san_pham}</option>
                    ))}
                    {products.length === 0 && (
                      <>
                        <option value="SP01">Dầu Gội Đầu Nam</option>
                        <option value="SP02">Nước Hoa Nam</option>
                        <option value="SP03">Sữa Tắm Nam</option>
                      </>
                    )}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    className="nk-input"
                    value={item.so_luong}
                    min="1"
                    onChange={e => handleItemChange(item.id, 'so_luong', Number(e.target.value))}
                  />
                </td>
                <td style={{ color: '#64748b', fontWeight: 500 }}>Cái</td>
                <td>
                  <input
                    type="number"
                    className="nk-input"
                    value={item.don_gia}
                    min="0"
                    step="1000"
                    onChange={e => handleItemChange(item.id, 'don_gia', Number(e.target.value))}
                  />
                </td>
                <td>
                  <div className="nk-actions">
                    <button className="nk-btn-action edit" title="Sửa">
                      <Edit size={14} /> Sửa
                    </button>
                    <button className="nk-btn-action delete" onClick={() => handleRemoveItem(item.id)} title="Xóa">
                      <Trash2 size={14} /> Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="nk-footer">
          <button className="nk-btn-add-row" onClick={handleAddItem}>
            <Plus size={20} /> Thêm Hàng
          </button>
          <button className="nk-btn-submit" onClick={handleSubmit}>
            <CheckCircle2 size={20} /> Hoàn Tất Nhập
          </button>
        </div>
      </div>
    </div>
  );
}

function LichSuGiaoDich({ apiFetch }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiFetch(`${API}/lich-su-giao-dich`);
        setHistory(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error('Lỗi tải lịch sử giao dịch:', err);
        setError(err.message || 'Không thể tải lịch sử giao dịch');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [apiFetch]);

  const handleExportHistory = () => {
    const headers = ['Thời gian', 'Sản phẩm', 'Loại', 'Số lượng'];
    const rows = history.map(item => ({
      'Thời gian': formatDateTime(item.thoi_gian || item.ngay_gd),
      'Sản phẩm': item.ten_san_pham,
      'Loại': item.loai,
      'Số lượng': item.so_luong
    }));
    downloadCsv('lich_su_giao_dich.csv', headers, rows);
  };

  return (
    <div className="fade-in">
      <header className="content-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Lịch sử giao dịch</h2>
          <button onClick={handleExportHistory} className="btn-base btn-excel" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#10b981', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px' }}>
            <FileSpreadsheet size={16} /> Xuất CSV
          </button>
        </div>
      </header>

      <div className="glass-card scroll-table">
        {loading ? (
          <div style={{ padding: '24px', color: '#64748b' }}>Đang tải lịch sử giao dịch...</div>
        ) : error ? (
          <div style={{ padding: '24px', color: '#c2410c' }}>{error}</div>
        ) : history.length === 0 ? (
          <div style={{ padding: '24px', color: '#64748b' }}>Không tìm thấy giao dịch nào.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Sản phẩm</th>
                <th>Loại</th>
                <th>Số lượng</th>
              </tr>
            </thead>
            <tbody>
              {history.map(item => (
                <tr key={`${item.id}-${item.thoi_gian || item.ngay_gd}`}>
                  <td>{formatDateTime(item.thoi_gian || item.ngay_gd)}</td>
                  <td>{item.ten_san_pham}</td>
                  <td style={{ textTransform: 'capitalize' }}>{item.loai}</td>
                  <td>{item.so_luong}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// --- QUẢN LÝ VỊ TRÍ KHO (MỚI) ---
function LocationManager({ user, apiFetch }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ ten_vi_tri: "", mo_ta: "" });

  const fetchAll = async () => {
    try {
      const data = await apiFetch(`${API}/vi-tri`);
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`${API}/vi-tri`, { method: "POST", body: JSON.stringify(form) });
      setForm({ ten_vi_tri: "", mo_ta: "" });
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa vị trí này?")) return;
    try {
      await apiFetch(`${API}/vi-tri/${id}`, { method: "DELETE" });
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fade-in">
      <header className="content-header">
        <h2>Quản lý vị trí kệ hàng</h2>
      </header>
      <div className="manager-layout">
        <form className="glass-card product-form" onSubmit={handleSubmit}>
          <h4>Thêm vị trí mới</h4>
          <div className="input-row">
            <input placeholder="Tên vị trí (VD: Kệ A1)" value={form.ten_vi_tri} onChange={e => setForm({...form, ten_vi_tri: e.target.value})} required />
            <input placeholder="Mô tả" value={form.mo_ta} onChange={e => setForm({...form, mo_ta: e.target.value})} />
          </div>
          <button type="submit" className="confirm-btn">Lưu vị trí</button>
        </form>
        <div className="glass-card scroll-table">
          <table>
            <thead><tr><th>Tên vị trí</th><th>Mô tả</th><th>Thao tác</th></tr></thead>
            <tbody>
              {list.map(item => (
                <tr key={item.id}>
                  <td className="font-bold">{item.ten_vi_tri}</td>
                  <td>{item.mo_ta}</td>
                  <td>
                    <button className="delete-btn" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- CHUYỂN KHO NỘI BỘ (MỚI) ---
function ChuyenKhoManager({ user, apiFetch }) {
  const [stock, setStock] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ san_pham_id: "", vi_tri_moi: "" });

  useEffect(() => {
    const load = async () => {
      const s = await apiFetch(`${API}/ton-kho`);
      setStock(Array.isArray(s) ? s : []);
      const l = await apiFetch(`${API}/vi-tri`);
      setLocations(Array.isArray(l) ? l : []);
    };
    load();
  }, [apiFetch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`${API}/chuyen-kho`, { method: "POST", body: JSON.stringify(form) });
      alert("Chuyển kho thành công!");
      const s = await apiFetch(`${API}/ton-kho`);
      setStock(Array.isArray(s) ? s : []);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fade-in">
      <header className="content-header">
        <h2>Điều chuyển kho nội bộ</h2>
      </header>
      <div className="manager-layout">
        <form className="glass-card product-form" onSubmit={handleSubmit}>
          <h4>Lệnh điều chuyển</h4>
          <div className="input-group-um" style={{marginBottom: '15px'}}>
            <label>Sản phẩm cần chuyển</label>
            <select value={form.san_pham_id} onChange={e => setForm({...form, san_pham_id: e.target.value})} required>
              <option value="">-- Chọn sản phẩm --</option>
              {stock.map(item => <option key={item.id} value={item.id}>{item.ten_san_pham} (Hiện tại: {item.vi_tri})</option>)}
            </select>
          </div>
          <div className="input-group-um" style={{marginBottom: '15px'}}>
            <label>Vị trí đích</label>
            <select value={form.vi_tri_moi} onChange={e => setForm({...form, vi_tri_moi: e.target.value})} required>
              <option value="">-- Chọn vị trí mới --</option>
              {locations.map(l => <option key={l.id} value={l.ten_vi_tri}>{l.ten_vi_tri}</option>)}
            </select>
          </div>
          <button type="submit" className="confirm-btn">Thực hiện chuyển</button>
        </form>
      </div>
    </div>
  );
}

// --- KIỂM KÊ KHO (MỚI) ---
function KiemKeManager({ user, apiFetch }) {
  const [stock, setStock] = useState([]);
  const [form, setForm] = useState({ san_pham_id: "", so_luong_thuc_te: "", ghi_chu: "" });

  useEffect(() => {
    apiFetch(`${API}/ton-kho`).then(s => setStock(Array.isArray(s) ? s : []));
  }, [apiFetch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`${API}/kiem-ke`, { method: "POST", body: JSON.stringify(form) });
      alert(`Đã cập nhật! Chênh lệch: ${res.chenh_lech}`);
      apiFetch(`${API}/ton-kho`).then(s => setStock(Array.isArray(s) ? s : []));
      setForm({ san_pham_id: "", so_luong_thuc_te: "", ghi_chu: "" });
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fade-in">
      <header className="content-header">
        <h2>Kiểm kê & Điều chỉnh kho</h2>
      </header>
      <div className="manager-layout">
        <form className="glass-card product-form" onSubmit={handleSubmit}>
          <h4>Phiếu kiểm kê</h4>
          <div className="input-group-um" style={{marginBottom: '10px'}}>
            <label>Sản phẩm kiểm kê</label>
            <select value={form.san_pham_id} onChange={e => setForm({...form, san_pham_id: e.target.value})} required>
              <option value="">-- Chọn sản phẩm --</option>
              {stock.map(item => <option key={item.id} value={item.id}>{item.ten_san_pham} (Sổ sách: {item.so_luong})</option>)}
            </select>
          </div>
          <div className="input-group-um" style={{marginBottom: '10px'}}>
            <label>Số lượng thực tế</label>
            <input type="number" value={form.so_luong_thuc_te} onChange={e => setForm({...form, so_luong_thuc_te: e.target.value})} required />
          </div>
          <div className="input-group-um" style={{marginBottom: '10px'}}>
            <label>Ghi chú</label>
            <input type="text" value={form.ghi_chu} onChange={e => setForm({...form, ghi_chu: e.target.value})} />
          </div>
          <button type="submit" className="confirm-btn">Xác nhận điều chỉnh</button>
        </form>
      </div>
    </div>
  );
}

// Dashboard (Đã gộp Báo Cáo + Dự báo AI)
function Dashboard({ user, apiFetch }) {

  const [stats, setStats] = useState({ tongSanPham: 0, tongTonKho: 0, sapHetHang: 0, doiTac: 0, aiDuBao: 0 });
  const [chartData, setChartData] = useState(lineDataSample);
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [dashboardError, setDashboardError] = useState(null);
  const [abcXyzSummary, setAbcXyzSummary] = useState({ A: 0, B: 0, C: 0, X: 0, Y: 0, Z: 0 });
  const [historyAvailable, setHistoryAvailable] = useState(true);

  // State cho AI Prediction
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [showAiReport, setShowAiReport] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [snapshotStatus, setSnapshotStatus] = useState(null);
  const [revenueData, setRevenueData] = useState([
    { name: '01/10', value: 2400 }, { name: '05/10', value: 1398 },
    { name: '10/10', value: 9800 }, { name: '15/10', value: 3908 },
    { name: '20/10', value: 4800 }, { name: '25/10', value: 3800 },
    { name: '30/10', value: 4300 },
  ]);

  const [ioData, setIoData] = useState([
    { name: 'T2', nhap: 4000, xuat: 2400 }, { name: 'T3', nhap: 3000, xuat: 1398 },
    { name: 'T4', nhap: 2000, xuat: 9800 }, { name: 'T5', nhap: 2780, xuat: 3908 },
    { name: 'T6', nhap: 1890, xuat: 4800 }, { name: 'T7', nhap: 2390, xuat: 3800 },
    { name: 'CN', nhap: 3490, xuat: 4300 },
  ]);

  const exportDashboardToExcel = (stockData, classification) => {
    const headers = ['Sản phẩm', 'Số lượng', 'Vị trí', 'Tình trạng', 'ABC', 'X/Y/Z'];
    const rows = stockData.map(item => ({
      'Sản phẩm': item.ten_san_pham,
      'Số lượng': item.so_luong,
      'Vị trí': item.vi_tri || 'Kệ chờ',
      'Tình trạng': item.so_luong < 10 ? 'Sắp hết' : 'Ổn định',
      'ABC': item.phan_loai_abc || '',
      'X/Y/Z': historyAvailable ? `${classification.X || 0}/${classification.Y || 0}/${classification.Z || 0}` : ''
    }));
    downloadCsv('dashboard_ton_kho.csv', headers, rows);
  };

  const exportDashboardToPdf = (stockData, statsData, classification) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFontSize(16);
    doc.text('Báo cáo Dashboard Kho', 40, 50);
    doc.setFontSize(11);
    doc.text(`Ngày tạo: ${new Date().toLocaleString('vi-VN')}`, 40, 70);
    doc.text(`Tổng sản phẩm: ${statsData.tongSanPham}`, 40, 90);
    doc.text(`Tổng tồn kho: ${statsData.tongTonKho}`, 40, 105);
    doc.text(`Sắp hết: ${statsData.sapHetHang}`, 40, 120);
    doc.text(`Nhà cung cấp: ${statsData.doiTac}`, 40, 135);

    autoTable(doc, {
      startY: 155,
      head: [[ 'Sản phẩm', 'Số lượng', 'Vị trí', 'Tình trạng' ]],
      body: stockData.map(item => [
        item.ten_san_pham,
        item.so_luong,
        item.vi_tri || 'Kệ chờ',
        item.so_luong < 10 ? 'Sắp hết' : 'Ổn định'
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] }
    });
    doc.save('dashboard_report.pdf');
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const productsResponse = await apiFetch(`${API}/san-pham`);
        const prods = Array.isArray(productsResponse) ? productsResponse : [];
        setProducts(prods);
        setStats(prev => ({ ...prev, tongSanPham: prods.length }));

        const stockResponse = await apiFetch(`${API}/ton-kho`);
        const st = Array.isArray(stockResponse) ? stockResponse : [];
        setStock(st);
        const total = st.reduce((sum, item) => sum + (Number(item.so_luong) || 0), 0);
        const lowStock = st.filter(item => item.so_luong < 10).length;
        setStats(prev => ({ ...prev, tongTonKho: total, sapHetHang: lowStock }));

        const formatted = st.slice(0, 7).map(item => ({
          name: item.ten_san_pham.substring(0, 5),
          uv: item.so_luong
        }));
        if (formatted.length > 0) setChartData(formatted);

        const supplierResponse = await apiFetch(`${API}/nha-cung-cap`);
        const ncc = Array.isArray(supplierResponse) ? supplierResponse : [];
        setStats(prev => ({ ...prev, doiTac: ncc.length }));

        // Chỉ lấy lịch sử giao dịch nếu là admin hoặc quản lý để tránh lỗi 403 gây logout
        if (user && (user.vai_tro === 'admin' || user.vai_tro === 'quan_ly')) {
          try {
            const historyResponse = await apiFetch(`${API}/lich-su-giao-dich`);
            const history = Array.isArray(historyResponse) ? historyResponse : [];
            setAbcXyzSummary(calculateAbcXyzSummary(prods, st, history));
          } catch (err) {
            console.warn("Không lấy được dữ liệu lịch sử giao dịch để phân loại ABC/XYZ:", err);
            setHistoryAvailable(false);
          }
        } else {
          setHistoryAvailable(false);
        }

        try {
          const aiData = await apiFetch(`${AI_API}/predict`);
          if (aiData.status === "success") {
            setStats(prev => ({ ...prev, aiDuBao: aiData.predicted_value }));
          }
        } catch (err) {
          console.warn("Không lấy được dữ liệu AI predict:", err);
        }
      } catch (err) {
        console.error("Lỗi tải dashboard:", err);
        setDashboardError(err.message || "Lỗi tải dữ liệu dashboard");
      }
    };

    loadDashboard();
  }, []);

  const categoryData = products.reduce((acc, current) => {
    const cat = current.danh_muc || "Khác";
    const existing = acc.find(i => i.name === cat);
    if (existing) existing.value += 1;
    else acc.push({ name: cat, value: 1 });
    return acc;
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const refreshAbcClassification = async () => {
    try {
      await apiFetch(`${AI_API}/classify-abc`, { method: 'POST' });
      const historyResponse = await apiFetch(`${API}/lich-su-giao-dich`);
      const history = Array.isArray(historyResponse) ? historyResponse : [];
      setAbcXyzSummary(calculateAbcXyzSummary(products, stock, history));
      setHistoryAvailable(true);
      alert('Đã cập nhật phân loại ABC thành công!');
    } catch (err) {
      alert('Không thể cập nhật phân loại ABC: ' + err.message);
    }
  };

  return (
    <div className="dashboard-wrapper fade-in" style={{ paddingBottom: '40px' }}>
      <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Dashboard & Báo Cáo Thống Kê</h2>
        <div className="report-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => exportDashboardToExcel(stock, abcXyzSummary)} className="btn-base btn-excel" style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}><FileSpreadsheet size={16} /> Xuất Excel</button>
          <button onClick={() => exportDashboardToPdf(stock, stats, abcXyzSummary)} className="btn-base btn-pdf" style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}><FileText size={16} /> Xuất PDF</button>
          {(user.vai_tro === 'admin' || user.vai_tro === 'quan_ly') && (
            <button onClick={refreshAbcClassification} className="btn-base btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'transparent', color: '#334155', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}><BarChart3 size={16} /> Cập nhật ABC</button>
          )}
        </div>
      </div>
      {dashboardError && (
        <div style={{ marginBottom: '16px', padding: '16px', borderRadius: '12px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          <strong>Lỗi tải dashboard:</strong> {dashboardError}
        </div>
      )}

      <div className="stat-cards">
        <StatItem icon={<Box size={24} color="#3b82f6" />} label="Sản phẩm" value={stats.tongSanPham} bg="#eff6ff" />
        <StatItem icon={<ShoppingCart size={24} color="#10b981" />} label="Tổng tồn" value={stats.tongTonKho} bg="#ecfdf5" />
        <StatItem icon={<AlertTriangle size={24} color="#ef4444" />} label="Cảnh báo hàng" value={stats.sapHetHang} bg="#fff1f2" />
        <StatItem icon={<Users size={24} color="#f59e0b" />} label="Nhà cung cấp" value={stats.doiTac} bg="#fffbeb" />
      </div>
      <div className="abc-xyz-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
        <div className="report-card" style={{ padding: '20px', borderRadius: '16px', background: '#ffffff', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.05)' }}>
          <h3 style={{ marginBottom: '12px', color: '#1e293b' }}>Phân loại ABC</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1, background: '#dcfce7', padding: '16px', borderRadius: '14px' }}><strong>A</strong><div style={{ marginTop: '10px', fontSize: '28px' }}>{abcXyzSummary.A}</div></div>
            <div style={{ flex: 1, background: '#fef3c7', padding: '16px', borderRadius: '14px' }}><strong>B</strong><div style={{ marginTop: '10px', fontSize: '28px' }}>{abcXyzSummary.B}</div></div>
            <div style={{ flex: 1, background: '#e2e8f0', padding: '16px', borderRadius: '14px' }}><strong>C</strong><div style={{ marginTop: '10px', fontSize: '28px' }}>{abcXyzSummary.C}</div></div>
          </div>
        </div>
        <div className="report-card" style={{ padding: '20px', borderRadius: '16px', background: '#ffffff', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.05)' }}>
          <h3 style={{ marginBottom: '12px', color: '#1e293b' }}>Phân loại XYZ</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1, background: '#eef2ff', padding: '16px', borderRadius: '14px' }}><strong>X</strong><div style={{ marginTop: '10px', fontSize: '28px' }}>{abcXyzSummary.X}</div></div>
            <div style={{ flex: 1, background: '#fef2f2', padding: '16px', borderRadius: '14px' }}><strong>Y</strong><div style={{ marginTop: '10px', fontSize: '28px' }}>{abcXyzSummary.Y}</div></div>
            <div style={{ flex: 1, background: '#f0fdf4', padding: '16px', borderRadius: '14px' }}><strong>Z</strong><div style={{ marginTop: '10px', fontSize: '28px' }}>{abcXyzSummary.Z}</div></div>
          </div>
        </div>
      </div>
      {(!historyAvailable && (user.vai_tro === 'admin' || user.vai_tro === 'quan_ly')) && (
        <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', background: '#fef3f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          Không thể lấy dữ liệu lịch sử giao dịch để phân loại ABC/XYZ. Vui lòng kiểm tra quyền truy cập hoặc backend `/lich-su-giao-dich`.
        </div>
      )}

      <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div className="report-card" style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>Tồn kho thực tế</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="uv" stroke="#3b82f6" strokeWidth={3} fill="url(#colorUv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card" style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>Nhập / Xuất Hàng</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ioData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="nhap" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="xuat" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card" style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>Doanh Thu Tháng</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card" style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>Top Sản Phẩm Bán Chạy</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData.length > 0 ? categoryData : [{ name: 'Trống', value: 1 }]}
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {(categoryData.length > 0 ? categoryData : [{ name: 'Trống', value: 1 }]).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="report-card mt-4" style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', marginTop: '20px' }}>
        <div className="card-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ color: '#1e293b' }}>Chi tiết tồn kho hiện tại</h3>
          <div className="text-muted font-medium" style={{ color: '#64748b' }}>Tổng: {stock.length} sản phẩm</div>
        </div>
        <div className="scroll-table mt-4" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '12px' }}>Sản phẩm</th>
                <th style={{ padding: '12px' }}>Số lượng</th>
                <th style={{ padding: '12px' }}>Vị trí</th>
                <th style={{ padding: '12px' }}>Tình trạng</th>
              </tr>
            </thead>
            <tbody>
              {stock.slice(0, 10).map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td className="font-bold" style={{ padding: '12px', fontWeight: 'bold' }}>{item.ten_san_pham}</td>
                  <td style={{ padding: '12px' }}><span className="stock-count" style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>{item.so_luong}</span></td>
                  <td className="text-muted" style={{ padding: '12px', color: '#64748b' }}>{item.vi_tri || "Kệ A1"}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: item.so_luong < 10 ? '#fee2e2' : '#dcfce3',
                      color: item.so_luong < 10 ? '#ef4444' : '#10b981'
                    }}>
                      {item.so_luong < 10 ? 'Sắp hết' : 'Ổn định'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* === SECTION DỰ BÁO NHU CẦU AI === */}
      <div style={{
        marginTop: '30px',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        borderRadius: '16px',
        padding: '30px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20px', left: '50px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <BrainCircuit size={28} color="#a78bfa" />
              <h2 style={{
                margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '0.5px',
                background: 'linear-gradient(90deg, #f472b6, #a78bfa, #818cf8, #38bdf8, #34d399, #fbbf24, #f472b6)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'gradientShift 3s linear infinite'
              }}>🤖 Dự Báo Nhu Cầu Sản Phẩm</h2>
              <span style={{ background: 'linear-gradient(135deg, #f472b6, #a78bfa)', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, color: 'white', boxShadow: '0 2px 8px rgba(167,139,250,0.3)' }}>BETA</span>
            </div>
            <p style={{ margin: 0, color: '#a5b4fc', fontSize: '14px' }}>Phân tích dữ liệu lịch sử giao dịch để dự đoán nhu cầu 30 ngày tới</p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={async () => {
                try {
                  const data = await apiFetch(`${AI_API}/ai-report`);
                  if (data.status === 'success') {
                    setAiReport(data);
                    setShowAiReport(true);
                  } else {
                    setAiError('Lỗi: ' + data.message);
                  }
                } catch (err) {
                  setAiError('Không thể kết nối đến AI Server để lấy báo cáo.');
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: 'white', padding: '14px 20px', borderRadius: '12px', cursor: 'pointer',
                fontSize: '15px', fontWeight: 600, transition: 'all 0.3s ease', position: 'relative', zIndex: 1
              }}
            >
              <BarChart2 size={20} /> Báo cáo chuyên sâu
            </button>
            <button
              onClick={async () => {
                setSnapshotStatus(null);
                setAiError(null);
                try {
                  const response = await fetch(`${AI_API}/snapshot-inventory`, {
                    method: 'POST'
                  });
                  const data = await response.json();
                  if (data.status === 'success') {
                    setSnapshotStatus(`Lưu snapshot kho thành công: ${data.snapshots_saved} bản ghi.`);
                  } else {
                    setAiError(data.message || 'Lỗi khi lưu snapshot kho');
                  }
                } catch (err) {
                  setAiError('Không thể kết nối đến AI Server để lưu snapshot kho.');
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: 'white', padding: '14px 20px', borderRadius: '12px', cursor: 'pointer',
                fontSize: '15px', fontWeight: 600, transition: 'all 0.3s ease', position: 'relative', zIndex: 1
              }}
            >
              <Save size={20} /> Lưu Snapshot Kho
            </button>
            <button
              onClick={async () => {
                setAiLoading(true);
                setAiError(null);
                try {
                  const data = await apiFetch(`${AI_API}/predict-all`);
                  if (data.status === 'success') {
                    setAiResult(data);
                  } else {
                    setAiError(data.message || 'Lỗi không xác định từ AI server');
                  }
                } catch (err) {
                  setAiError('Không thể kết nối đến AI Server. Hãy đảm bảo đã chạy: python AI/main.py');
                } finally {
                  setAiLoading(false);
                }
              }}
              disabled={aiLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: aiLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                color: 'white', border: 'none', padding: '14px 28px',
                borderRadius: '12px', cursor: aiLoading ? 'wait' : 'pointer',
                fontSize: '15px', fontWeight: 600,
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.3s ease',
                position: 'relative', zIndex: 1
              }}
            >
              {aiLoading ? (
                <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Đang phân tích dữ liệu...</>
              ) : (
                <><Sparkles size={20} /> Chạy Dự Báo AI</>
              )}
            </button>
          </div>
          {snapshotStatus && (
            <div style={{ marginTop: '16px', padding: '14px 18px', borderRadius: '12px', background: '#ecfdf5', color: '#166534', border: '1px solid #bbf7d0' }}>
              {snapshotStatus}
            </div>
          )}
        </div>

        {/* Error message */}
        {aiError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px', padding: '14px 18px', marginTop: '15px',
            color: '#fca5a5', fontSize: '14px', position: 'relative', zIndex: 1
          }}>
            <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            {aiError}
          </div>
        )}

        {/* AI Results */}
        {aiResult && (
          <div style={{ marginTop: '20px', position: 'relative', zIndex: 1 }}>
            {/* Stats summary */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px 20px', flex: '1', minWidth: '150px' }}>
                <div style={{ fontSize: '12px', color: '#a5b4fc', marginBottom: '4px' }}>Sản phẩm phân tích</div>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>{aiResult.total_products}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px 20px', flex: '1', minWidth: '150px' }}>
                <div style={{ fontSize: '12px', color: '#a5b4fc', marginBottom: '4px' }}>Giao dịch đã phân tích</div>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>{aiResult.total_transactions?.toLocaleString()}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px 20px', flex: '1', minWidth: '150px' }}>
                <div style={{ fontSize: '12px', color: '#a5b4fc', marginBottom: '4px' }}>Cần bổ sung gấp</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#f87171' }}>
                  {aiResult.predictions?.filter(p => p.status_color === 'critical' || p.status_color === 'low').length}
                </div>
              </div>
            </div>

            {/* Bar Chart: Tồn kho vs Dự báo */}
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#e0e7ff' }}>So sánh Tồn kho vs Nhu cầu dự báo 30 ngày</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={aiResult.predictions?.map(p => ({
                  name: p.ten_san_pham.length > 8 ? p.ten_san_pham.substring(0, 8) + '...' : p.ten_san_pham,
                  'Tồn kho': p.ton_kho_hien_tai,
                  'Dự báo': p.du_bao_30_ngay
                }))} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} tick={{ fill: '#a5b4fc' }} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tick={{ fill: '#a5b4fc' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                    labelStyle={{ color: '#a5b4fc' }}
                  />
                  <Bar dataKey="Tồn kho" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="Dự báo" fill="#f472b6" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Results Table */}
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sản phẩm</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tồn kho / ROP</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nhu cầu 30 ngày</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trạng thái</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Độ tin cậy</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Đề xuất</th>
                  </tr>
                </thead>
                <tbody>
                  {aiResult.predictions?.map((item, idx) => {
                    const statusStyles = {
                      critical: { bg: 'rgba(239,68,68,0.2)', color: '#fca5a5', icon: <PackageX size={14} /> },
                      low: { bg: 'rgba(251,146,60,0.2)', color: '#fdba74', icon: <PackageMinus size={14} /> },
                      warning: { bg: 'rgba(250,204,21,0.2)', color: '#fde047', icon: <AlertTriangle size={14} /> },
                      good: { bg: 'rgba(34,197,94,0.2)', color: '#86efac', icon: <PackageCheck size={14} /> },
                    };
                    const st = statusStyles[item.status_color] || statusStyles.good;

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '14px' }}>{item.ten_san_pham}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px' }}>
                          <span style={{ background: 'rgba(96,165,250,0.15)', padding: '4px 10px', borderRadius: '6px', color: '#93c5fd', fontWeight: 600, marginRight: '5px' }}>
                            {item.ton_kho_hien_tai}
                          </span>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ {item.reorder_point || 0}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px' }}>
                          <span style={{ background: 'rgba(244,114,182,0.15)', padding: '4px 10px', borderRadius: '6px', color: '#f9a8d4', fontWeight: 600 }}>
                            {item.du_bao_30_ngay}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            background: st.bg, color: st.color,
                            padding: '4px 10px', borderRadius: '6px',
                            fontSize: '12px', fontWeight: 600
                          }}>
                            {st.icon} {item.trang_thai}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                            background: item.do_tin_cay === 'Cao' ? 'rgba(34,197,94,0.2)' : item.do_tin_cay === 'Trung bình' ? 'rgba(250,204,21,0.2)' : 'rgba(239,68,68,0.2)',
                            color: item.do_tin_cay === 'Cao' ? '#86efac' : item.do_tin_cay === 'Trung bình' ? '#fde047' : '#fca5a5'
                          }}>
                            {item.do_tin_cay}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#cbd5e1' }}>{item.de_xuat}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6366f1' }}>
              <span>Phương pháp: Linear Regression | Dữ liệu: 12 tháng gần nhất</span>
              <span>Cập nhật: {new Date().toLocaleString('vi-VN')}</span>
            </div>
          </div>
        )}
      </div>

      {/* CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* AI Report Modal */}
      {showAiReport && aiReport && (
        <div className="modal-overlay" onClick={() => setShowAiReport(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '800px', maxWidth: '90%', background: 'white', padding: '24px', borderRadius: '16px', color: 'black' }}>
            <h2 style={{ marginTop: 0, color: '#1e293b' }}>📊 Báo cáo AI Chuyên Sâu</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginTop: 0, color: '#334155', fontSize: '16px' }}>Độ Chính Xác Mô Hình</h3>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981' }}>
                  {((aiReport.accuracy_metrics?.avg_r2_score || 0) * 100).toFixed(1)}%
                </div>
                <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>R2 Score Trung bình</p>

                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ color: '#475569', fontSize: '14px', marginBottom: '8px' }}>Lịch sử huấn luyện gần đây:</h4>
                  <ul style={{ paddingLeft: '20px', color: '#64748b', fontSize: '13px', margin: 0 }}>
                    {aiReport.models_history?.map((m, i) => (
                      <li key={i}>{m.model_name} ({m.version}) - R2: {m.r2_score.toFixed(2)}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginTop: 0, color: '#334155', fontSize: '16px', marginBottom: '16px' }}>Heatmap Mức Độ Bận Rộn</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={aiReport.heatmap} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="day" type="category" width={40} fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="morning" stackId="a" fill="#60a5fa" name="Sáng" />
                    <Bar dataKey="afternoon" stackId="a" fill="#f472b6" name="Chiều" />
                    <Bar dataKey="evening" stackId="a" fill="#a78bfa" name="Tối" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowAiReport(false)}
                style={{ padding: '8px 16px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// Hàm bổ trợ StatItem (Dán ngay dưới hàm Dashboard)
function StatItem({ icon, label, value, bg }) {
  return (
    <div className="stat-card-inner">
      <div className="stat-icon-wrapper" style={{ backgroundColor: bg }}>{icon}</div>
      <div className="stat-info">
        <p>{label}</p>
        <h3>{value.toLocaleString()}</h3>
      </div>
    </div>
  );
}

// --- QUẢN LÝ NGƯỜI DÙNG ---
function UserManager({ user, apiFetch }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const defaultForm = {
    ho_ten: "",
    vai_tro: "nhan_vien",
    ten_dang_nhap: "",
    mat_khau: "",
    quyen_xem: true,
    quyen_sua: false,
    quyen_xoa: false
  };
  const [form, setForm] = useState(defaultForm);

  // Tải danh sách nhân viên từ database
  const fetchUsers = async () => {
    try {
      const data = await apiFetch(`${API}/nguoi-dung`);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải danh sách nhân viên:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    if (!form.ho_ten || !form.ten_dang_nhap || (!editingId && !form.mat_khau)) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      if (editingId) {
        await apiFetch(`${API}/nguoi-dung/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(form)
        });
        alert("Cập nhật nhân viên thành công!");
      } else {
        await apiFetch(`${API}/nguoi-dung`, {
          method: "POST",
          body: JSON.stringify(form)
        });
        alert("Thêm nhân viên thành công!");
      }
      resetForm();
      fetchUsers();
    } catch (error) {
      alert("Lỗi: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
      try {
        await apiFetch(`${API}/nguoi-dung/${id}`, { method: "DELETE" });
        alert("Xóa nhân viên thành công!");
        fetchUsers();
      } catch (error) {
        alert("Lỗi: " + error.message);
      }
    }
  };

  const handleEdit = (userData) => {
    setForm({
      ho_ten: userData.ho_ten,
      vai_tro: userData.vai_tro,
      ten_dang_nhap: userData.ten_dang_nhap,
      mat_khau: "",
      quyen_xem: userData.quyen_xem,
      quyen_sua: userData.quyen_sua,
      quyen_xoa: userData.quyen_xoa
    });
    setEditingId(userData.id);
  };

  return (
    <div className="fade-in user-manager-container">
      <div className="um-header">
        <h2>Quản Lý Người Dùng</h2>
      </div>

      <div className="manager-layout">
        {/* --- FORM THÊM/SỬA NHÂN VIÊN --- */}
        {user?.vai_tro === 'admin' && (
          <form className="glass-card user-form" onSubmit={handleSubmitUser}>
            <h4>{editingId ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}</h4>
            <div className="user-form-grid">
              <div className="input-group-um">
                <label>Họ Tên</label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={form.ho_ten}
                  onChange={e => setForm({ ...form, ho_ten: e.target.value })}
                  required
                />
              </div>
              <div className="input-group-um">
                <label>Vai Trò</label>
                <select
                  value={form.vai_tro}
                  onChange={e => setForm({ ...form, vai_tro: e.target.value })}
                >
                  <option value="nhan_vien">Nhân viên</option>
                  <option value="quan_ly">Quản lý</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="input-group-um">
                <label>Tên Đăng Nhập</label>
                <input
                  type="text"
                  placeholder="username123"
                  value={form.ten_dang_nhap}
                  onChange={e => setForm({ ...form, ten_dang_nhap: e.target.value })}
                  required
                />
              </div>
              <div className="input-group-um">
                <label>Mật Khẩu</label>
                <input
                  type="password"
                  placeholder="********"
                  value={form.mat_khau}
                  onChange={e => setForm({ ...form, mat_khau: e.target.value })}
                  required={!editingId}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
              <button type="submit" className="confirm-btn" style={{ width: 'fit-content' }}>
                <Users size={18} style={{ marginRight: '8px' }} /> {editingId ? 'Cập nhật' : 'Thêm nhân viên'}
              </button>
              {editingId && (
                <button type="button" className="secondary-btn" onClick={resetForm}>
                  Hủy
                </button>
              )}
            </div>
          </form>
        )}

        <div className="glass-card scroll-table">
          {loading ? (
            <div className="text-center text-muted p-5">
              Đang tải danh sách nhân viên...
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Tên Đăng Nhập</th>
                  <th>Cấp Bậc</th>
                  <th style={{ textAlign: 'center' }}>Xem</th>
                  <th style={{ textAlign: 'center' }}>Sửa</th>
                  <th style={{ textAlign: 'center' }}>Xóa</th>
                  {user?.vai_tro === 'admin' && <th style={{ textAlign: 'center' }}>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted p-5">
                      Chưa có nhân viên nào trong danh sách
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td className="font-bold">{u.ho_ten}</td>
                      <td className="text-muted">{u.ten_dang_nhap}</td>
                      <td className="font-medium text-muted">{u.vai_tro}</td>
                      <td className="text-center">
                        <label className="toggle-switch">
                          <input type="checkbox" checked={u.quyen_xem} readOnly />
                          <span className="slider"></span>
                        </label>
                      </td>
                      <td className="text-center">
                        <label className="toggle-switch">
                          <input type="checkbox" checked={u.quyen_sua} readOnly />
                          <span className="slider"></span>
                        </label>
                      </td>
                      <td className="text-center">
                        <label className="toggle-switch">
                          <input type="checkbox" checked={u.quyen_xoa} readOnly />
                          <span className="slider"></span>
                        </label>
                      </td>
                      {user?.vai_tro === 'admin' && (
                        <td className="text-center">
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button
                              className="edit-btn"
                              type="button"
                              onClick={() => handleEdit(u)}
                              title="Sửa nhân viên"
                              style={{ padding: '6px 10px' }}
                            >
                              <Edit size={14} />
                            </button>
                            {u.vai_tro !== "admin" && (
                              <button
                                className="delete-btn"
                                onClick={() => handleDelete(u.id)}
                                title="Xóa nhân viên"
                                style={{ padding: '6px 10px' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}


// --- QUẢN LÝ XUẤT KHO ---
function XuatKhoManager({ user, apiFetch }) {
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState("");
  const [items, setItems] = useState([
    { id: 1, san_pham_id: "", so_luong_xuat: 300 }
  ]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchStock = async () => {
    try {
      const data = await apiFetch(`${API}/ton-kho`);
      setStock(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải tồn kho:", err);
      setErrorMessage(err.message || "Không thể tải dữ liệu tồn kho");
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await apiFetch(`${API}/san-pham`);
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Lỗi tải danh sách sản phẩm:", err);
        setErrorMessage(err.message || "Không thể tải danh sách sản phẩm");
      }
    };

    loadProducts();
    fetchStock();
  }, []);

  const handleItemChange = (id, field, value) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const getTheoreticalStock = (productId) => {
    const s = stock.find(st => st.san_pham_id == productId);
    return s ? s.so_luong : 0;
  };

  const handleSubmit = async () => {
    setStatusMessage("");
    setErrorMessage("");

    if (!customer) {
      setErrorMessage("Vui lòng chọn khách hàng!");
      return;
    }
    if (items.some(i => !i.san_pham_id || i.so_luong_xuat <= 0)) {
      setErrorMessage("Vui lòng chọn sản phẩm và số lượng hợp lệ!");
      return;
    }

    for (const item of items) {
      const theory = getTheoreticalStock(item.san_pham_id);
      if (theory < item.so_luong_xuat) {
        setErrorMessage(`Sản phẩm với ID ${item.san_pham_id} không đủ tồn kho để xuất!`);
        return;
      }
    }

    try {
      await apiFetch(`${API}/xuat-kho-hang-loat`, {
        method: "POST",
        body: JSON.stringify({ items, customer_id: customer })
      });

      setStatusMessage("Đã xác nhận xuất kho thành công!");
      setItems([{ id: Date.now(), san_pham_id: "", so_luong_xuat: 0 }]);
      setCustomer("");
      fetchStock();
    } catch (error) {
      setErrorMessage(error.message || "Không thể thực hiện xuất kho");
    }
  };

  return (
    <div className="fade-in xuat-kho-container">
      <div className="xk-header-row">
        <h2>Xuất Kho</h2>
        <div className="xk-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm nhanh theo Mã hoặc Tên..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      {(statusMessage || errorMessage) && (
        <div style={{ marginTop: '12px', padding: '14px', borderRadius: '12px', background: errorMessage ? '#fee2e2' : '#ecfdf5', border: `1px solid ${errorMessage ? '#fecaca' : '#a7f3d0'}`, color: errorMessage ? '#b91c1c' : '#166534' }}>
          {errorMessage ? errorMessage : statusMessage}
        </div>
      )}

      <div className="xk-card">
        <div className="xk-customer-select">
          <select value={customer} onChange={e => setCustomer(e.target.value)}>
            <option value="">-- Chọn Khách Hàng --</option>
            <option value="C01">Khách Hàng A</option>
            <option value="C02">Khách Hàng B</option>
          </select>
        </div>

        <div className="scroll-table xk-table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Tên Sản Phẩm</th>
                <th style={{ width: '20%' }}>Tồn Kho Lý Thuyết</th>
                <th style={{ width: '20%' }}>Số Lượng Xuất</th>
                <th style={{ width: '20%', textAlign: 'center' }}>Sai Lệch</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const theory = getTheoreticalStock(item.san_pham_id);
                const diff = (Number(item.so_luong_xuat) || 0) - theory;
                return (
                  <tr key={item.id}>
                    <td>
                      <select
                        className="xk-select-cell"
                        value={item.san_pham_id}
                        onChange={e => handleItemChange(item.id, 'san_pham_id', e.target.value)}
                      >
                        <option value="">Chọn sản phẩm</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.ten_san_pham}</option>)}
                      </select>
                    </td>
                    <td className="font-bold">{theory}</td>
                    <td>
                      <input
                        type="number"
                        className="xk-input-cell"
                        value={item.so_luong_xuat}
                        onChange={e => handleItemChange(item.id, 'so_luong_xuat', e.target.value)}
                      />
                    </td>
                    <td className="text-center">
                      {item.san_pham_id && (
                        theory < Number(item.so_luong_xuat) ?
                          <AlertTriangle size={20} color="#ef4444" title="Vượt quá tồn kho!" /> :
                          <CheckCircle2 size={20} color="#10b981" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="xk-footer">
          <button className="btn-base btn-ghost" onClick={() => window.history.back()}>
            <ArrowLeft size={16} /> Trở về
          </button>
          <button className="btn-base btn-confirm-xuat" onClick={handleSubmit}>
            Xác nhận xuất kho
          </button>
        </div>
      </div>
    </div>
  );
}

