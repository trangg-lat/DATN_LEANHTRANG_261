import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Box, Warehouse, ArrowDownCircle,
  ArrowUpCircle, ClipboardCheck, BrainCircuit,
  BarChart3, BarChart2, LogOut, UserCircle, Users, Edit, Trash2,
  ShoppingCart, AlertTriangle, FileSpreadsheet, FileText,
  Search, ArrowLeft, CheckCircle2, Plus, PlusCircle, Save,
  TrendingUp, Loader2, Sparkles, PackageCheck, PackageMinus, PackageX,
  ArrowRightCircle, MapPin, ClipboardList, Settings2, Moon, Sun,
  Bell, BellOff, ShieldAlert, ShieldCheck, Info, RefreshCw, Filter
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell, ReferenceLine, ComposedChart
} from 'recharts';
import html2pdf from 'html2pdf.js';
import "./App.css";


const confirmToast = (message) => new Promise((resolve) => {
  const isDark = localStorage.getItem('theme') === 'dark';
  const secondaryBtnStyle = {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
    color: isDark ? '#FAFAFA' : '#0F172A',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.06)',
  };
  toast((t) => (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>⚠️ {message}</p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button className="confirm-btn" style={{ padding: '6px 16px', fontSize: '13px', background: '#ef4444' }} onClick={() => { toast.dismiss(t.id); resolve(true); }}>Xóa</button>
        <button className="secondary-btn" style={{ padding: '6px 16px', fontSize: '13px', ...secondaryBtnStyle }} onClick={() => { toast.dismiss(t.id); resolve(false); }}>Hủy</button>
      </div>
    </div>
  ), { duration: Infinity, style: { border: '1px solid #fecaca', padding: '16px', color: '#b91c1c' } });
});

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

  let abc = { Cao: 0, TrungBinh: 0, Thap: 0 };
  let xyz = { OnDinh: 0, BienDong: 0, KhoDuBao: 0 };
  const details = {};

  sorted.forEach((item, idx) => {
    let abcClass = "Thấp";
    if (idx < aCount) {
      abc.Cao += 1;
      abcClass = "Cao";
    } else if (idx < aCount + bCount) {
      abc.TrungBinh += 1;
      abcClass = "Trung bình";
    } else {
      abc.Thap += 1;
    }

    let xyzClass = "Khó dự báo";
    if (item.transactionCount >= 6) {
      xyz.OnDinh += 1;
      xyzClass = "Ổn định";
    } else if (item.transactionCount >= 3) {
      xyz.BienDong += 1;
      xyzClass = "Biến động";
    } else {
      xyz.KhoDuBao += 1;
    }

    details[item.id] = { abcClass, xyzClass };
  });

  return { 
    summary: { ...abc, ...xyz }, 
    details 
  };
}

// --- THÀNH PHẦN TOP HEADER CHUNG ---
function TopHeader({ user, onProfileClick, theme, toggleTheme }) {
  return (
    <header className="top-header">
      <div className="header-left">
        <Warehouse size={24} className="header-icon" />
        <span className="header-brand">QUẢN LÝ KHO THÔNG MINH </span>
        <span className="header-nav-item" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Kho lưu trữ nội bộ</span>
      </div>
      <div className="header-right">
        <div className="icon-badge-wrapper" onClick={toggleTheme} title="Chuyển đổi giao diện Sáng/Tối">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </div>
        <Link 
          to={user && (user.vai_tro === 'admin' || user.vai_tro === 'quan_ly') ? "/san-pham" : "/ton-kho"} 
          className="icon-badge-wrapper" 
          title={user && (user.vai_tro === 'admin' || user.vai_tro === 'quan_ly') ? "Danh sách sản phẩm" : "Xem tồn kho"}
        >
          <Box size={20} />
        </Link>
        <Link to="/kiem-ke" className="icon-badge-wrapper" title="Kiểm kê kho">
          <ClipboardCheck size={20} />
        </Link>
        <Link 
          to="/#ai-predictions" 
          className="icon-badge-wrapper" 
          title="Dự báo nhu cầu AI" 
          onClick={() => {
            if (window.location.pathname === '/') {
              const element = document.getElementById('ai-predictions');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }}
        >
          <span className="notification-dot"></span>
          <BrainCircuit size={20} />
        </Link>
        {user ? (
          <div className="user-profile-btn" onClick={onProfileClick}>
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

  const isDark = localStorage.getItem('theme') === 'dark';
  const secondaryBtnStyle = {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
    color: isDark ? '#FAFAFA' : '#0F172A',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.06)',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ho_ten: hoTen };
      if (matKhauMoi) {
        if (!matKhauCu) return toast.error("Vui lòng nhập mật khẩu cũ!")
        payload.mat_khau_cu = matKhauCu;
        payload.mat_khau_moi = matKhauMoi;
      }
      await apiFetch(`${API}/me`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      toast.success("Cập nhật thông tin thành công!")

      // Update local storage user name
      const storedUser = JSON.parse(localStorage.getItem('user'));
      storedUser.ho_ten = hoTen;
      localStorage.setItem('user', JSON.stringify(storedUser));
      window.location.reload();
    } catch (err) {
      toast.error("Lỗi: " + err.message)
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
            <button type="button" className="secondary-btn" style={secondaryBtnStyle} onClick={onClose}>Hủy</button>
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

  // Theme state
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme : "dark"; // Default to dark mode as requested
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

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
        toast(data.message)
      }
    } catch (error) {
      toast.error("Lỗi kết nối server!")
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
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="font-sans antialiased">
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

            <div className="main-wrapper">
              <TopHeader user={user} onProfileClick={() => setShowProfile(true)} theme={theme} toggleTheme={toggleTheme} />
            {/* --- NỘI DUNG CHÍNH --- */}
            <main className="content">
              <Routes>
                <Route path="/" element={<Dashboard user={user} apiFetch={apiFetch} theme={theme} />} />

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
          <div className="login-icon-container">
            <Warehouse size={40} color="#c084fc" />
          </div>
          <div className="login-header-text">
            <h1>HỆ THỐNG</h1>
            <p>QUẢN LÝ KHO</p>
          </div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(username, password); }} className="login-form">
          <div className="input-group">
            <UserCircle className="icon" />
            <input type="text" placeholder="Tài khoản / Email" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="input-group">
            <span className="icon" style={{fontSize: '16px'}}>🔒</span>
            <input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="login-btn">Đăng Nhập</button>
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
      toast(error.message)
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
      toast(error.message)
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!await confirmToast("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;

    try {
      await apiFetch(`${API}/san-pham/${id}`, { method: "DELETE" });
      fetchAll();
    } catch (error) {
      toast.error("Lỗi: " + error.message)
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
      toast.error("Không thể lưu sản phẩm: " + error.message)
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
                <th>Tầm quan trọng</th>
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
                      background: (item.phan_loai_abc || '').includes('Cao') || item.phan_loai_abc === 'A' ? 'rgba(34,197,94,0.2)' : (item.phan_loai_abc || '').includes('Trung bình') || item.phan_loai_abc === 'B' ? 'rgba(250,204,21,0.2)' : 'rgba(148,163,184,0.2)',
                      color: (item.phan_loai_abc || '').includes('Cao') || item.phan_loai_abc === 'A' ? '#4ade80' : (item.phan_loai_abc || '').includes('Trung bình') || item.phan_loai_abc === 'B' ? '#facc15' : '#94a3b8',
                      padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold'
                    }}>
                      {item.phan_loai_abc || 'Thấp'}
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
      toast(error.message)
    }
  };
  const fetchProducts = async () => {
    try {
      const data = await apiFetch(`${API}/san-pham`);
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast(error.message)
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
      toast(error.message)
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
      toast(error.message)
    }
  };
  const fetchSuppliers = async () => {
    try {
      const data = await apiFetch(`${API}/nha-cung-cap`);
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast(error.message)
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
      toast.success("Đã thêm Nhà cung cấp mới thành công!")
    } catch (err) {
      toast.error("Không thể thêm nhà cung cấp: " + err.message)
    }
  };

  const handleSubmit = async () => {
    if (!supplier) return toast.error("Vui lòng chọn nhà cung cấp!")
    if (items.some(i => !i.san_pham_id || i.so_luong <= 0)) {
      return toast.error("Vui lòng chọn sản phẩm và số lượng hợp lệ cho tất cả các dòng!")
    }

    try {
      await apiFetch(`${API}/nhap-kho-hang-loat`, {
        method: "POST",
        body: JSON.stringify({ items, supplier_id: supplier })
      });
      toast.success("Đã lưu thông tin nhập kho thành công!")
      setItems([{ id: Date.now(), san_pham_id: "", so_luong: 1, don_gia: 0 }]);
      setSupplier("");
    } catch (error) {
      toast.error("Lỗi: " + error.message)
    }
  };

  const isDark = localStorage.getItem('theme') === 'dark';
  const secondaryBtnStyle = {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
    color: isDark ? '#FAFAFA' : '#0F172A',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.06)',
  };

  return (
    <div className="fade-in nhapkho-container">
      <div className="nk-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Nhập Kho</h2>
        <div className="actions" style={{ display: 'flex', gap: '10px' }}>
          <button className="secondary-btn" style={{ padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', ...secondaryBtnStyle }}><FileSpreadsheet size={16} /> Nhập Lô</button>
          <button className="secondary-btn" style={{ padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', ...secondaryBtnStyle }}><Save size={16} /> Lưu Nháp</button>
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
            className="secondary-btn"
            style={{ padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', height: '42px', ...secondaryBtnStyle }}
            onClick={handleAddSupplier}
          >
            <PlusCircle size={16} /> Thêm Mới
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
                  <div className="actions">
                    <button className="edit-btn" title="Sửa">
                      <Edit size={16} /> Sửa
                    </button>
                    <button className="delete-btn" onClick={() => handleRemoveItem(item.id)} title="Xóa">
                      <Trash2 size={16} /> Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="nk-footer" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button className="secondary-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', ...secondaryBtnStyle }} onClick={handleAddItem}>
            <Plus size={18} /> Thêm Hàng
          </button>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleSubmit}>
            <CheckCircle2 size={18} /> Hoàn Tất Nhập
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

  const totalPages = Math.ceil(history.length / itemsPerPage);
  const currentData = history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          <div style={{ padding: '24px' }}>
            {/* Skeleton Loading */}
            {[1,2,3,4,5].map(i => (
              <div key={i} className="skeleton" style={{ height: '40px', width: '100%', marginBottom: '10px', borderRadius: '8px' }}></div>
            ))}
          </div>
        ) : error ? (
          <div style={{ padding: '24px', color: '#c2410c' }}>{error}</div>
        ) : history.length === 0 ? (
          <div style={{ padding: '24px', color: '#64748b' }}>Không tìm thấy giao dịch nào.</div>
        ) : (
          <>
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
                {currentData.map(item => (
                  <tr key={`${item.id}-${item.thoi_gian || item.ngay_gd}`}>
                    <td>{formatDateTime(item.thoi_gian || item.ngay_gd)}</td>
                    <td className="font-bold text-gray-800">{item.ten_san_pham}</td>
                    <td style={{ textTransform: 'capitalize' }}>
                      <span style={{ 
                        background: item.loai === 'nhap' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', 
                        color: item.loai === 'nhap' ? '#059669' : '#dc2626',
                        padding: '4px 8px', borderRadius: '4px', fontWeight: '600'
                      }}>
                        {item.loai}
                      </span>
                    </td>
                    <td className="font-bold" style={{ color: item.loai === 'nhap' ? '#10b981' : '#ef4444' }}>
                      {item.loai === 'nhap' ? '+' : '-'}{item.so_luong}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>
                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} đến {Math.min(currentPage * itemsPerPage, history.length)} trong tổng số {history.length} bản ghi
              </span>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ padding: '6px 12px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f8fafc' : 'white', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#334155' }}
                >
                  Trang trước
                </button>
                <span style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', borderRadius: '6px', fontWeight: 'bold' }}>
                  {currentPage}
                </span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '6px 12px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f8fafc' : 'white', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: '#334155' }}
                >
                  Trang sau
                </button>
              </div>
            </div>
          </>
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
      toast(err.message)
    }
  };

  const handleDelete = async (id) => {
    if (!await confirmToast("Xóa vị trí này?")) return;
    try {
      await apiFetch(`${API}/vi-tri/${id}`, { method: "DELETE" });
      fetchAll();
    } catch (err) {
      toast(err.message)
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

      {/* --- SƠ ĐỒ KHO HÀNG VISUAL --- */}
      <div className="glass-card" style={{ marginTop: '20px' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
          <MapPin size={22} color="#3b82f6" /> Sơ đồ kho hàng trực quan
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '20px',
          padding: '25px',
          background: '#f8fafc',
          borderRadius: '16px',
          border: '2px dashed #cbd5e1'
        }}>
          {list.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
              <Warehouse size={48} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <p>Chưa có vị trí kệ hàng nào được tạo.</p>
            </div>
          ) : (
            list.map((item, idx) => (
              <div key={item.id} style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px 15px',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '120px',
                transition: 'transform 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Warehouse size={36} color={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][idx % 5]} style={{ marginBottom: '12px' }} />
                <strong style={{ color: '#1e293b', fontSize: '15px' }}>{item.ten_vi_tri}</strong>
                <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.mo_ta || "Kệ chứa hàng"}
                </span>
                
                {/* Trạng thái hoạt động */}
                <div style={{ 
                  position: 'absolute', top: '-8px', right: '-8px', 
                  background: '#10b981', color: 'white', fontSize: '10px', fontWeight: 'bold', 
                  width: '24px', height: '24px', borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                }}>
                  ✓
                </div>
              </div>
            ))
          )}
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
      toast.success("Chuyển kho thành công!")
      const s = await apiFetch(`${API}/ton-kho`);
      setStock(Array.isArray(s) ? s : []);
    } catch (err) {
      toast(err.message)
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
      toast(`Đã cập nhật! Chênh lệch: ${res.chenh_lech}`)
      apiFetch(`${API}/ton-kho`).then(s => setStock(Array.isArray(s) ? s : []));
      setForm({ san_pham_id: "", so_luong_thuc_te: "", ghi_chu: "" });
    } catch (err) {
      toast(err.message)
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

// --- CUSTOM TOOLTIP CHO BIỂU ĐỒ ---
const CustomTooltip = ({ active, payload, label, unit = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((pld, index) => {
          if (pld.dataKey === 'forecast' && pld.payload.value !== null && pld.payload.value !== undefined) {
            return null;
          }
          return (
            <div key={index} className="tooltip-value-row">
              <span className="tooltip-dot" style={{ backgroundColor: pld.color || pld.fill }} />
              <span className="tooltip-name">{pld.name}: </span>
              <span className="tooltip-value">
                {Number(pld.value).toLocaleString()}{unit}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

// --- DỰ BÁO DOANH THU & XU HƯỚNG ---
const getRevenueForecastData = (data) => {
  if (!data || data.length === 0) return [];
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i].value;
    sumXY += i * data[i].value;
    sumXX += i * i;
  }
  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / n;

  const result = data.map((d, i) => ({
    name: d.name,
    value: d.value,
    forecast: i === n - 1 ? d.value : null
  }));

  const lastDateStr = data[n - 1].name;
  const parts = lastDateStr.split('/');
  const day = parts[0] ? Number(parts[0]) : 30;
  const month = parts[1] ? Number(parts[1]) : 10;

  for (let j = 1; j <= 3; j++) {
    const nextIdx = n - 1 + j;
    const val = Math.max(0, Math.round(slope * nextIdx + intercept));
    
    let nextDay = day + j * 5;
    let nextMonth = month;
    if (nextDay > 31) {
      nextDay = nextDay - 31;
      nextMonth = month + 1;
      if (nextMonth > 12) nextMonth = 1;
    }
    const nextDateStr = `${String(nextDay).padStart(2, '0')}/${String(nextMonth).padStart(2, '0')}`;
    
    result.push({
      name: `${nextDateStr} (Dự báo)`,
      value: null,
      forecast: val,
      isForecast: true
    });
  }
  return result;
};

const calculateTrend = (data) => {
  if (!data || data.length < 2) return { percent: 0, isUp: true };
  const first = data[0].value;
  const last = data[data.length - 1].value;
  const diff = last - first;
  const percent = first !== 0 ? ((diff / first) * 100).toFixed(1) : 0;
  return { percent: Math.abs(percent), isUp: diff >= 0 };
};

// Dashboard (Đã gộp Báo Cáo + Dự báo AI)
function Dashboard({ user, apiFetch, theme }) {
  const isDark = theme === 'dark';
  const subCardStyles = {
    Cao: {
      bg: isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7',
      color: isDark ? '#4ade80' : '#15803d'
    },
    TrungBinh: {
      bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
      color: isDark ? '#facc15' : '#b45309'
    },
    Thap: {
      bg: isDark ? 'rgba(148, 163, 184, 0.15)' : '#e2e8f0',
      color: isDark ? '#cbd5e1' : '#475569'
    },
    OnDinh: {
      bg: isDark ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff',
      color: isDark ? '#818cf8' : '#4338ca'
    },
    BienDong: {
      bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
      color: isDark ? '#fca5a5' : '#b91c1c'
    },
    KhoDuBao: {
      bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4',
      color: isDark ? '#34d399' : '#047857'
    }
  };

  const [stats, setStats] = useState({ tongSanPham: 0, tongTonKho: 0, sapHetHang: 0, doiTac: 0, aiDuBao: 0 });
  const [chartData, setChartData] = useState(lineDataSample);
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [dashboardError, setDashboardError] = useState(null);
  const [abcXyzSummary, setAbcXyzSummary] = useState({ Cao: 0, TrungBinh: 0, Thap: 0, OnDinh: 0, BienDong: 0, KhoDuBao: 0 });
  const [productClassDetails, setProductClassDetails] = useState({});
  const [historyAvailable, setHistoryAvailable] = useState(true);

  // Alert Dashboard states
  const [alerts, setAlerts] = useState([]);
  const [alertFilter, setAlertFilter] = useState('all'); // 'all' | 'critical' | 'warning' | 'info'
  const [alertDismissed, setAlertDismissed] = useState(new Set());
  const [showAlertDashboard, setShowAlertDashboard] = useState(true);

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

  const exportDashboardToExcel = (stockData, details) => {
    const headers = ['Sản phẩm', 'Số lượng', 'Vị trí', 'Tình trạng', 'Mức độ quan trọng', 'Độ ổn định'];
    const rows = stockData.map(item => {
      const detail = details[item.id] || details[item.san_pham_id] || {};
      return {
        'Sản phẩm': item.ten_san_pham,
        'Số lượng': item.so_luong,
        'Vị trí': item.vi_tri || 'Kệ chờ',
        'Tình trạng': item.so_luong < 10 ? 'Sắp hết' : 'Ổn định',
        'Mức độ quan trọng': detail.abcClass || item.phan_loai_abc || 'Thấp',
        'Độ ổn định': detail.xyzClass || (historyAvailable ? 'Khó dự báo' : '')
      };
    });
    downloadCsv('dashboard_ton_kho.csv', headers, rows);
  };

  const exportDashboardToPdf = (stockData, statsData, classification) => {
    try {
      console.log('Dữ liệu PDF:', { stockData, statsData });
      
      // Tạo element HTML cho PDF
      const element = document.createElement('div');
      element.style.padding = '20px';
      element.style.fontFamily = 'Arial, sans-serif';
      element.style.backgroundColor = '#ffffff';
      
      // Tạo HTML content
      let tableRows = '';
      if (stockData && stockData.length > 0) {
        tableRows = stockData.map((item, idx) => `
          <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
            <td style="border: 1px solid #ddd; padding: 10px; text-align: left;">${item.ten_san_pham || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${item.so_luong || 0}</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: left;">${item.vi_tri || 'Kệ chờ'}</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">
              <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; ${item.so_luong < 10 ? 'background-color: #fee2e2; color: #b91c1c;' : 'background-color: #dcfce7; color: #166534;'}">${item.so_luong < 10 ? 'Sắp hết' : 'Ổn định'}</span>
            </td>
          </tr>
        `).join('');
      } else {
        tableRows = '<tr><td colspan="4" style="border: 1px solid #ddd; padding: 10px; text-align: center; color: #94a3b8;">Không có dữ liệu</td></tr>';
      }
      
      element.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #0f172a; margin: 10px 0; font-size: 28px;">BÁO CÁO DASHBOARD KHO</h1>
          <p style="color: #64748b; font-size: 12px; margin: 5px 0;">Ngày tạo: ${new Date().toLocaleString('vi-VN')}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #0f172a; font-size: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">Thống kê</h3>
          <ul style="font-size: 14px; line-height: 2; color: #1e293b; padding-left: 20px;">
            <li><strong>Tổng sản phẩm:</strong> ${(statsData && statsData.tongSanPham) || 0}</li>
            <li><strong>Tổng tồn kho:</strong> ${(statsData && statsData.tongTonKho) || 0} sản phẩm</li>
            <li><strong>Sắp hết hàng:</strong> ${(statsData && statsData.sapHetHang) || 0} sản phẩm</li>
            <li><strong>Nhà cung cấp:</strong> ${(statsData && statsData.doiTac) || 0}</li>
          </ul>
        </div>
        
        <div>
          <h3 style="color: #0f172a; font-size: 16px; border-bottom: 2px solid #10b981; padding-bottom: 8px; margin-bottom: 15px;">Chi tiết sản phẩm</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background-color: #10b981; color: white;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Sản phẩm</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Số lượng</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Vị trí</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Tình trạng</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 11px;">
          <p>Báo cáo được tạo tự động - ${new Date().toLocaleString('vi-VN')}</p>
        </div>
      `;
      
      // Thêm element vào DOM tạm thời
      document.body.appendChild(element);
      
      // Cấu hình PDF
      const opt = {
        margin: 10,
        filename: 'dashboard_report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };
      
      // Tạo PDF từ HTML element
      html2pdf().set(opt).from(element).save().then(() => {
        // Xóa element sau khi xuất xong
        document.body.removeChild(element);
        toast.success('Xuất PDF thành công!');
      });
    } catch (error) {
      console.error('Lỗi xuất PDF:', error);
      toast.error('Lỗi xuất PDF: ' + error.message);
    }
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

        // Tạo alerts từ dữ liệu tồn kho
        const generatedAlerts = [];
        st.forEach(item => {
          const qty = Number(item.so_luong) || 0;
          if (qty === 0) {
            generatedAlerts.push({
              id: `out-${item.id}`,
              type: 'critical',
              sanPhamId: item.id,
              ten_san_pham: item.ten_san_pham,
              so_luong: qty,
              vi_tri: item.vi_tri || 'Kệ chờ',
              message: `Sản phẩm đã hết hàng hoàn toàn!`,
              action: 'Cần nhập hàng ngay',
              timestamp: new Date().toISOString()
            });
          } else if (qty < 5) {
            generatedAlerts.push({
              id: `critical-${item.id}`,
              type: 'critical',
              sanPhamId: item.id,
              ten_san_pham: item.ten_san_pham,
              so_luong: qty,
              vi_tri: item.vi_tri || 'Kệ chờ',
              message: `Tồn kho cực thấp (${qty} ${item.don_vi || 'đơn vị'})`,
              action: 'Nhập hàng khẩn cấp',
              timestamp: new Date().toISOString()
            });
          } else if (qty < 10) {
            generatedAlerts.push({
              id: `warning-${item.id}`,
              type: 'warning',
              sanPhamId: item.id,
              ten_san_pham: item.ten_san_pham,
              so_luong: qty,
              vi_tri: item.vi_tri || 'Kệ chờ',
              message: `Tồn kho sắp hết (${qty} ${item.don_vi || 'đơn vị'})`,
              action: 'Lên kế hoạch nhập hàng',
              timestamp: new Date().toISOString()
            });
          } else if (qty > 500) {
            generatedAlerts.push({
              id: `overstock-${item.id}`,
              type: 'info',
              sanPhamId: item.id,
              ten_san_pham: item.ten_san_pham,
              so_luong: qty,
              vi_tri: item.vi_tri || 'Kệ chờ',
              message: `Tồn kho quá cao (${qty} ${item.don_vi || 'đơn vị'}) — có thể tồn đọng`,
              action: 'Xem xét kế hoạch xử lý',
              timestamp: new Date().toISOString()
            });
          }
        });
        // Sắp xếp: critical trước, warning sau, info cuối
        generatedAlerts.sort((a, b) => {
          const order = { critical: 0, warning: 1, info: 2 };
          return order[a.type] - order[b.type];
        });
        setAlerts(generatedAlerts);
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
            const res = calculateAbcXyzSummary(prods, st, history);
            setAbcXyzSummary(res.summary);
            setProductClassDetails(res.details);
          } catch (err) {
            console.warn("Không lấy được dữ liệu lịch sử giao dịch để phân loại hàng hóa:", err);
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

  useEffect(() => {
    if (window.location.hash === '#ai-predictions') {
      setTimeout(() => {
        const element = document.getElementById('ai-predictions');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
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
      // Bước 1: Lấy lịch sử giao dịch từ backend
      const historyResponse = await apiFetch(`${API}/lich-su-giao-dich`);
      const history = Array.isArray(historyResponse) ? historyResponse : [];

      // Bước 2: Gọi AI server phân loại ABC + XYZ và lưu vào DB
      let aiServerOk = false;
      let xyzOk = false;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        // Phân loại ABC
        const aiRes = await fetch(`${AI_API}/classify-abc`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });
        if (aiRes.ok) aiServerOk = true;

        // Phân loại XYZ (mới - lưu phan_loai_xyz vào DB)
        const xyzRes = await fetch(`${AI_API}/classify-xyz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (xyzRes.ok) xyzOk = true;

        clearTimeout(timeout);
      } catch (aiErr) {
        console.warn('AI server không khả dụng, tính toán phân loại cục bộ:', aiErr.message);
      }

      // Bước 3: Tính toán phân loại ABC/XYZ cục bộ để hiển thị ngay
      const res = calculateAbcXyzSummary(products, stock, history);
      setAbcXyzSummary(res.summary);
      setProductClassDetails(res.details);
      setHistoryAvailable(true);

      if (aiServerOk && xyzOk) {
        toast.success('Đã cập nhật phân loại ABC + XYZ thành công! (Đã lưu vào DB)');
      } else if (aiServerOk) {
        toast.success('Đã cập nhật phân loại ABC thành công!');
      } else {
        toast.success('Đã cập nhật phân loại hàng hóa (tính toán cục bộ — AI server chưa chạy)');
      }
    } catch (err) {
      console.error('refreshAbcClassification error:', err);
      let errorMsg = err.message;
      if (err.message === 'Lỗi kết nối API' || err.name === 'TypeError') {
        errorMsg = 'Không thể kết nối backend. Vui lòng kiểm tra server Node.js đang chạy.';
      }
      toast.error('Không thể cập nhật phân loại hàng hóa: ' + errorMsg);
    }
  };

  const trend = calculateTrend(revenueData);
  const revenueForecastData = getRevenueForecastData(revenueData);

  return (
    <div className="dashboard-wrapper fade-in" style={{ paddingBottom: '40px' }}>
      <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Dashboard & Báo Cáo Thống Kê</h2>
        <div className="report-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => exportDashboardToExcel(stock, productClassDetails)} className="btn-base btn-excel" style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}><FileSpreadsheet size={16} /> Xuất Excel</button>
          <button onClick={() => exportDashboardToPdf(stock, stats, abcXyzSummary)} className="btn-base btn-pdf" style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}><FileText size={16} /> Xuất PDF</button>
          {(user.vai_tro === 'admin' || user.vai_tro === 'quan_ly') && (
            <button onClick={refreshAbcClassification} className="btn-base btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'transparent', color: isDark ? '#f8fafc' : '#334155', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}><BarChart3 size={16} /> Cập nhật phân loại</button>
          )}
        </div>
      </div>
      {dashboardError && (
        <div style={{ marginBottom: '16px', padding: '16px', borderRadius: '12px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          <strong>Lỗi tải dashboard:</strong> {dashboardError}
        </div>
      )}

      <div className="stat-cards">
        <StatItem icon={<Box size={24} color="#3b82f6" />} label="Sản phẩm" value={stats.tongSanPham} type="info" theme={theme} />
        <StatItem icon={<ShoppingCart size={24} color="#10b981" />} label="Tổng tồn" value={stats.tongTonKho} type="success" theme={theme} />
        <StatItem icon={<AlertTriangle size={24} color="#ef4444" />} label="Cảnh báo hàng" value={stats.sapHetHang} type="danger" theme={theme} />
        <StatItem icon={<Users size={24} color="#f59e0b" />} label="Nhà cung cấp" value={stats.doiTac} type="warning" theme={theme} />
      </div>
      <div className="abc-xyz-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '12px' }}>Nhóm hàng theo mức độ quan trọng</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1, background: subCardStyles.Cao.bg, color: subCardStyles.Cao.color, padding: '16px', borderRadius: '14px', transition: 'all 0.3s' }}><strong style={{ color: subCardStyles.Cao.color }}>Cao</strong><div style={{ marginTop: '10px', fontSize: '28px', fontWeight: 'bold' }}>{abcXyzSummary.Cao}</div></div>
            <div style={{ flex: 1, background: subCardStyles.TrungBinh.bg, color: subCardStyles.TrungBinh.color, padding: '16px', borderRadius: '14px', transition: 'all 0.3s' }}><strong style={{ color: subCardStyles.TrungBinh.color }}>Trung bình</strong><div style={{ marginTop: '10px', fontSize: '28px', fontWeight: 'bold' }}>{abcXyzSummary.TrungBinh}</div></div>
            <div style={{ flex: 1, background: subCardStyles.Thap.bg, color: subCardStyles.Thap.color, padding: '16px', borderRadius: '14px', transition: 'all 0.3s' }}><strong style={{ color: subCardStyles.Thap.color }}>Thấp</strong><div style={{ marginTop: '10px', fontSize: '28px', fontWeight: 'bold' }}>{abcXyzSummary.Thap}</div></div>
          </div>
        </div>
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '12px' }}>Nhóm hàng theo độ ổn định nhu cầu</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1, background: subCardStyles.OnDinh.bg, color: subCardStyles.OnDinh.color, padding: '16px', borderRadius: '14px', transition: 'all 0.3s' }}><strong style={{ color: subCardStyles.OnDinh.color }}>Ổn định</strong><div style={{ marginTop: '10px', fontSize: '28px', fontWeight: 'bold' }}>{abcXyzSummary.OnDinh}</div></div>
            <div style={{ flex: 1, background: subCardStyles.BienDong.bg, color: subCardStyles.BienDong.color, padding: '16px', borderRadius: '14px', transition: 'all 0.3s' }}><strong style={{ color: subCardStyles.BienDong.color }}>Biến động</strong><div style={{ marginTop: '10px', fontSize: '28px', fontWeight: 'bold' }}>{abcXyzSummary.BienDong}</div></div>
            <div style={{ flex: 1, background: subCardStyles.KhoDuBao.bg, color: subCardStyles.KhoDuBao.color, padding: '16px', borderRadius: '14px', transition: 'all 0.3s' }}><strong style={{ color: subCardStyles.KhoDuBao.color }}>Khó dự báo</strong><div style={{ marginTop: '10px', fontSize: '28px', fontWeight: 'bold' }}>{abcXyzSummary.KhoDuBao}</div></div>
          </div>
        </div>
      </div>
      {(!historyAvailable && (user.vai_tro === 'admin' || user.vai_tro === 'quan_ly')) && (
        <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', background: '#fef3f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          Không thể lấy dữ liệu lịch sử giao dịch để phân loại hàng hóa. Vui lòng kiểm tra quyền truy cập hoặc backend `/lich-su-giao-dich`.
        </div>
      )}

      <div className="report-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {/* Tồn kho thực tế */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Tồn kho thực tế</h3>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#3b82f6', background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>Real-time</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={isDark ? 0.45 : 0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9"} />
              <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: isDark ? "#a1a1aa" : "#64748b" }} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: isDark ? "#a1a1aa" : "#64748b" }} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="uv" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                fill="url(#colorUv)" 
                activeDot={{ r: 6, stroke: isDark ? "#0a0a0a" : "#ffffff", strokeWidth: 2, fill: "#3b82f6" }} 
                animationDuration={1500}
                name="Tồn kho"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Nhập / Xuất */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Nhập / Xuất</h3>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>Hàng tuần</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ioData} barGap={6} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9"} />
              <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: isDark ? "#a1a1aa" : "#64748b" }} padding={{ left: 10, right: 10 }} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: isDark ? "#a1a1aa" : "#64748b" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="nhap" name="Nhập kho" fill="#10b981" radius={[4, 4, 0, 0]} barSize={14} animationDuration={1500} />
              <Bar dataKey="xuat" name="Xuất kho" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={14} animationDuration={1500} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Doanh thu tháng */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0 }}>Doanh Thu Tháng</h3>
              <span className={`trend-badge ${trend.isUp ? 'up' : 'down'}`}>
                {trend.isUp ? '↑' : '↓'} {trend.percent}%
              </span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b', background: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb', padding: '2px 8px', borderRadius: '4px' }}>Kế hoạch & Dự báo</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={revenueForecastData} margin={{ top: 10, right: 5, left: -5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9"} />
              <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: isDark ? "#a1a1aa" : "#64748b" }} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: isDark ? "#a1a1aa" : "#64748b" }} />
              <Tooltip content={<CustomTooltip unit="đ" />} />
              <ReferenceLine y={5000} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Mục tiêu: 5M', fill: '#f59e0b', position: 'top', fontSize: 10, fontWeight: 700 }} />
              <Bar dataKey="value" name="Doanh thu thực tế" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} animationDuration={1500} />
              <Line type="monotone" dataKey="forecast" name="Doanh thu dự báo" stroke="#ec4899" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, stroke: "#ec4899", strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} animationDuration={1500} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Top Sản Phẩm Bán Chạy */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Top Sản Phẩm Bán Chạy</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData.length > 0 ? categoryData : [{ name: 'Trống', value: 1 }]}
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                animationDuration={1500}
              >
                {(categoryData.length > 0 ? categoryData : [{ name: 'Trống', value: 1 }]).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card mt-4" style={{ padding: '20px', marginTop: '20px' }}>
        <div className="card-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3>Chi tiết tồn kho hiện tại</h3>
          <div className="text-muted font-medium" style={{ color: isDark ? '#a1a1aa' : '#64748b' }}>Tổng: {stock.length} sản phẩm</div>
        </div>
        <div className="scroll-table mt-4" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0', color: isDark ? '#a1a1aa' : '#64748b' }}>
                <th style={{ padding: '12px' }}>Sản phẩm</th>
                <th style={{ padding: '12px' }}>Số lượng</th>
                <th style={{ padding: '12px' }}>Vị trí</th>
                <th style={{ padding: '12px' }}>Tình trạng</th>
              </tr>
            </thead>
            <tbody>
              {stock.slice(0, 10).map(item => (
                <tr key={item.id} style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f1f5f9' }}>
                  <td className="font-bold" style={{ padding: '12px', fontWeight: 'bold' }}>{item.ten_san_pham}</td>
                  <td style={{ padding: '12px' }}><span className="stock-count" style={{ background: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)', color: isDark ? '#60a5fa' : '#2563eb', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>{item.so_luong}</span></td>
                  <td className="text-muted" style={{ padding: '12px', color: isDark ? '#a1a1aa' : '#64748b' }}>{item.vi_tri || "Kệ A1"}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: item.so_luong < 10 
                        ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2') 
                        : (isDark ? 'rgba(16, 185, 129, 0.2)' : '#dcfce3'),
                      color: item.so_luong < 10 
                        ? (isDark ? '#fca5a5' : '#ef4444') 
                        : (isDark ? '#86efac' : '#10b981')
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

      {/* === SECTION ALERT DASHBOARD === */}
      <div style={{ marginTop: '30px' }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '16px', flexWrap: 'wrap', gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2',
              borderRadius: '10px', padding: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bell size={22} color="#ef4444" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Trung Tâm Cảnh Báo</h3>
              <p style={{ margin: 0, fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
                Theo dõi tất cả cảnh báo tồn kho theo thời gian thực
              </p>
            </div>
            {alerts.filter(a => !alertDismissed.has(a.id)).length > 0 && (
              <span style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white', borderRadius: '20px', padding: '3px 10px',
                fontSize: '12px', fontWeight: 700,
                boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
                animation: 'pulse 2s infinite'
              }}>
                {alerts.filter(a => !alertDismissed.has(a.id)).length} cảnh báo
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* Filter buttons */}
            {[
              { key: 'all', label: 'Tất cả', color: isDark ? '#a1a1aa' : '#64748b', activeBg: isDark ? 'rgba(148,163,184,0.2)' : '#f1f5f9' },
              { key: 'critical', label: '🔴 Nguy cấp', color: '#ef4444', activeBg: 'rgba(239,68,68,0.15)' },
              { key: 'warning', label: '🟡 Cảnh báo', color: '#f59e0b', activeBg: 'rgba(245,158,11,0.15)' },
              { key: 'info', label: '🔵 Thông tin', color: '#3b82f6', activeBg: 'rgba(59,130,246,0.15)' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setAlertFilter(f.key)}
                style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                  border: alertFilter === f.key
                    ? `1px solid ${f.color}`
                    : isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                  background: alertFilter === f.key ? f.activeBg : 'transparent',
                  color: alertFilter === f.key ? f.color : (isDark ? '#a1a1aa' : '#64748b')
                }}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={() => setAlertDismissed(new Set())}
              title="Khôi phục tất cả cảnh báo"
              style={{
                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                background: 'transparent',
                color: isDark ? '#a1a1aa' : '#64748b',
                display: 'flex', alignItems: 'center', gap: '5px'
              }}
            >
              <RefreshCw size={13} /> Khôi phục
            </button>
          </div>
        </div>

        {/* Alert Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          {[
            {
              label: 'Nguy cấp',
              count: alerts.filter(a => a.type === 'critical' && !alertDismissed.has(a.id)).length,
              icon: <ShieldAlert size={20} />,
              bg: isDark ? 'rgba(239,68,68,0.12)' : '#fef2f2',
              border: isDark ? 'rgba(239,68,68,0.25)' : '#fecaca',
              color: '#ef4444',
              sub: 'Cần xử lý ngay'
            },
            {
              label: 'Cảnh báo',
              count: alerts.filter(a => a.type === 'warning' && !alertDismissed.has(a.id)).length,
              icon: <AlertTriangle size={20} />,
              bg: isDark ? 'rgba(245,158,11,0.12)' : '#fffbeb',
              border: isDark ? 'rgba(245,158,11,0.25)' : '#fde68a',
              color: '#f59e0b',
              sub: 'Cần theo dõi'
            },
            {
              label: 'Thông tin',
              count: alerts.filter(a => a.type === 'info' && !alertDismissed.has(a.id)).length,
              icon: <Info size={20} />,
              bg: isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff',
              border: isDark ? 'rgba(59,130,246,0.25)' : '#bfdbfe',
              color: '#3b82f6',
              sub: 'Tồn kho bất thường'
            },
            {
              label: 'Đã xử lý',
              count: alertDismissed.size,
              icon: <ShieldCheck size={20} />,
              bg: isDark ? 'rgba(16,185,129,0.12)' : '#ecfdf5',
              border: isDark ? 'rgba(16,185,129,0.25)' : '#a7f3d0',
              color: '#10b981',
              sub: 'Đã bỏ qua'
            }
          ].map(card => (
            <div
              key={card.label}
              style={{
                background: card.bg,
                border: `1px solid ${card.border}`,
                borderRadius: '14px', padding: '16px',
                display: 'flex', flexDirection: 'column', gap: '6px',
                transition: 'transform 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: card.color }}>
                {card.icon}
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{card.label}</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: card.color, lineHeight: 1 }}>
                {card.count}
              </div>
              <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Alert List */}
        {alerts.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <ShieldCheck size={48} color="#10b981" style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#10b981', margin: 0 }}>Không có cảnh báo nào!</p>
            <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '8px' }}>Tất cả sản phẩm đều ở mức tồn kho an toàn.</p>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr 100px 120px 1fr 120px 90px',
              gap: '12px',
              padding: '12px 20px',
              background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
              borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0',
              fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.5px', color: isDark ? '#94a3b8' : '#64748b'
            }}>
              <span></span>
              <span>Sản phẩm</span>
              <span style={{ textAlign: 'center' }}>Tồn kho</span>
              <span style={{ textAlign: 'center' }}>Mức độ</span>
              <span>Chi tiết cảnh báo</span>
              <span>Đề xuất</span>
              <span style={{ textAlign: 'center' }}>Thao tác</span>
            </div>

            {/* Table Rows */}
            {alerts
              .filter(a => !alertDismissed.has(a.id) && (alertFilter === 'all' || a.type === alertFilter))
              .map((alert, idx) => {
                const typeConfig = {
                  critical: {
                    color: '#ef4444',
                    bg: isDark ? 'rgba(239,68,68,0.08)' : '#fff5f5',
                    badgeBg: isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2',
                    label: 'Nguy cấp',
                    icon: <ShieldAlert size={14} />
                  },
                  warning: {
                    color: '#f59e0b',
                    bg: isDark ? 'rgba(245,158,11,0.06)' : '#fffdf0',
                    badgeBg: isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7',
                    label: 'Cảnh báo',
                    icon: <AlertTriangle size={14} />
                  },
                  info: {
                    color: '#3b82f6',
                    bg: isDark ? 'rgba(59,130,246,0.06)' : '#f8fbff',
                    badgeBg: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe',
                    label: 'Thông tin',
                    icon: <Info size={14} />
                  }
                };
                const cfg = typeConfig[alert.type] || typeConfig.info;

                return (
                  <div
                    key={alert.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '28px 1fr 100px 120px 1fr 120px 90px',
                      gap: '12px',
                      padding: '14px 20px',
                      alignItems: 'center',
                      borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid #f1f5f9',
                      background: idx % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'),
                      transition: 'background 0.2s'
                    }}
                  >
                    {/* Indicator dot */}
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: cfg.color,
                      boxShadow: `0 0 6px ${cfg.color}`,
                      justifySelf: 'center'
                    }} />

                    {/* Tên sản phẩm */}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{alert.ten_san_pham}</div>
                      <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>
                        📍 {alert.vi_tri}
                      </div>
                    </div>

                    {/* Số lượng */}
                    <div style={{ textAlign: 'center' }}>
                      <span style={{
                        background: alert.so_luong === 0
                          ? (isDark ? 'rgba(239,68,68,0.25)' : '#fecaca')
                          : (isDark ? 'rgba(99,102,241,0.2)' : '#e0e7ff'),
                        color: alert.so_luong === 0 ? '#ef4444' : (isDark ? '#818cf8' : '#4338ca'),
                        padding: '4px 10px', borderRadius: '6px',
                        fontWeight: 700, fontSize: '14px'
                      }}>
                        {alert.so_luong}
                      </span>
                    </div>

                    {/* Mức độ badge */}
                    <div style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        background: cfg.badgeBg, color: cfg.color,
                        padding: '4px 10px', borderRadius: '6px',
                        fontSize: '12px', fontWeight: 700
                      }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>

                    {/* Message */}
                    <div style={{ fontSize: '13px', color: isDark ? '#cbd5e1' : '#334155' }}>
                      {alert.message}
                    </div>

                    {/* Action */}
                    <div style={{ fontSize: '12px', color: cfg.color, fontWeight: 600 }}>
                      {alert.action}
                    </div>

                    {/* Dismiss button */}
                    <div style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => setAlertDismissed(prev => new Set([...prev, alert.id]))}
                        title="Bỏ qua cảnh báo này"
                        style={{
                          background: 'transparent',
                          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                          borderRadius: '6px', padding: '5px 10px',
                          cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                          color: isDark ? '#94a3b8' : '#64748b',
                          display: 'flex', alignItems: 'center', gap: '4px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <BellOff size={12} /> Bỏ qua
                      </button>
                    </div>
                  </div>
                );
              })
            }

            {/* Empty filter state */}
            {alerts.filter(a => !alertDismissed.has(a.id) && (alertFilter === 'all' || a.type === alertFilter)).length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: isDark ? '#94a3b8' : '#64748b' }}>
                <ShieldCheck size={36} color="#10b981" style={{ marginBottom: '8px' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>Không có cảnh báo loại này</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* === SECTION DỰ BÁO NHU CẦU AI === */}
      <div id="ai-predictions" style={{
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
              }}> Dự Báo Nhu Cầu Sản Phẩm</h2>
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

            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6366f1', flexWrap: 'wrap', gap: '6px' }}>
              <span>
                🤖 Mô hình: LSTM → ARIMA → Linear Regression (Feature Engineering) &nbsp;|&nbsp;
                📅 Features: Tháng, Quý, Mùa, Lịch lễ tết VN &nbsp;|&nbsp;
                📊 Dữ liệu: 12 tháng gần nhất
              </span>
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

      {/* AI Report Modal - Báo cáo chuyên sâu (MAE, RMSE, MAPE, Heatmap, Feature Engineering) */}
      {showAiReport && aiReport && (
        <div className="modal-overlay" onClick={() => setShowAiReport(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '900px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', background: 'white', padding: '28px', borderRadius: '20px', color: 'black' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ marginTop: 0, marginBottom: 0, color: '#1e293b', fontSize: '20px' }}>📊 Báo Cáo AI Chuyên Sâu</h2>
              <button onClick={() => setShowAiReport(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            {/* === PHẦN 1: Chỉ số đánh giá mô hình (MAE, RMSE, MAPE) === */}
            <h3 style={{ color: '#334155', fontSize: '15px', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>📐 Chỉ số đánh giá mô hình (Model Metrics)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {/* R2 Score */}
              <div style={{ padding: '16px', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', borderRadius: '12px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#065f46', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>R² Score</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669' }}>
                  {((aiReport.accuracy_metrics?.avg_r2_score || 0) * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Hệ số xác định</div>
              </div>
              {/* MAE */}
              <div style={{ padding: '16px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '12px', border: '1px solid #93c5fd', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>MAE</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb' }}>
                  {(aiReport.accuracy_metrics?.avg_mae || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Mean Abs. Error</div>
              </div>
              {/* RMSE */}
              <div style={{ padding: '16px', background: 'linear-gradient(135deg, #fefce8, #fef9c3)', borderRadius: '12px', border: '1px solid #fde047', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#854d0e', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>RMSE</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706' }}>
                  {(aiReport.accuracy_metrics?.avg_rmse || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Root Mean Sq. Error</div>
              </div>
              {/* MAPE */}
              <div style={{ padding: '16px', background: 'linear-gradient(135deg, #fdf4ff, #fae8ff)', borderRadius: '12px', border: '1px solid #d8b4fe', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#6b21a8', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>MAPE</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7c3aed' }}>
                  {(aiReport.accuracy_metrics?.avg_mape || 0).toFixed(1)}%
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Mean Abs. % Error</div>
              </div>
            </div>

            {/* === PHẦN 2: Lịch sử huấn luyện + Heatmap === */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              {/* Lịch sử huấn luyện */}
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ marginTop: 0, color: '#334155', fontSize: '14px', marginBottom: '12px' }}>🕐 Lịch sử huấn luyện gần đây</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '8px', textAlign: 'left', color: '#475569', fontWeight: 600 }}>Mô hình</th>
                      <th style={{ padding: '8px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>R²</th>
                      <th style={{ padding: '8px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>MAE</th>
                      <th style={{ padding: '8px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>RMSE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiReport.models_history?.map((m, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', color: '#1e293b' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {m.is_active && <span style={{ background: '#10b981', color: 'white', fontSize: '9px', padding: '2px 5px', borderRadius: '4px', fontWeight: 700 }}>ACTIVE</span>}
                            {(m.model_name || '').replace('v2', '').trim()}
                          </span>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center', color: '#059669', fontWeight: 600 }}>{(m.r2_score || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px', textAlign: 'center', color: '#2563eb' }}>{(m.mae || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px', textAlign: 'center', color: '#d97706' }}>{(m.rmse || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Heatmap bận rộn */}
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ marginTop: 0, color: '#334155', fontSize: '14px', marginBottom: '12px' }}>🔥 Heatmap Mức Độ Bận Rộn</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={aiReport.heatmap} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="day" type="category" width={42} fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                    <Bar dataKey="morning" stackId="a" fill="#60a5fa" name="Sáng" />
                    <Bar dataKey="afternoon" stackId="a" fill="#f472b6" name="Chiều" />
                    <Bar dataKey="evening" stackId="a" fill="#a78bfa" name="Tối" />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'center' }}>
                  {[['#60a5fa','Sáng'],['#f472b6','Chiều'],['#a78bfa','Tối']].map(([c,l]) => (
                    <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: c, display: 'inline-block' }} />{l}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* === PHẦN 3: Feature Engineering đã sử dụng === */}
            {aiReport.feature_engineering && (
              <div style={{ padding: '16px', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: '12px', border: '1px solid #7dd3fc', marginBottom: '16px' }}>
                <h4 style={{ marginTop: 0, color: '#0369a1', fontSize: '14px', marginBottom: '10px' }}>⚙️ Feature Engineering đã áp dụng</h4>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#0369a1' }}>📅 Thuộc tính thời gian:</span>
                    <span style={{ color: '#334155', marginLeft: '6px' }}>
                      {(aiReport.feature_engineering.time_features || []).join(', ')}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: '#0369a1' }}>🎉 Biến ngoại vi:</span>
                    <span style={{ color: '#334155', marginLeft: '6px' }}>
                      {(aiReport.feature_engineering.external_variables || []).join(', ')}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: '#0369a1' }}>🔢 Sliding Window:</span>
                    <span style={{ color: '#334155', marginLeft: '6px' }}>
                      {aiReport.feature_engineering.sliding_window}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowAiReport(false)}
                style={{ padding: '10px 24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
              >
                Đóng báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// Hàm bổ trợ StatItem (Dán ngay dưới hàm Dashboard)
function StatItem({ icon, label, value, type, theme }) {
  const isDark = theme === 'dark';
  const stateStyles = {
    info: {
      bg: isDark ? 'rgba(59, 130, 246, 0.12)' : '#eff6ff',
      border: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)',
      color: isDark ? '#60a5fa' : '#1e40af',
      textMuted: isDark ? '#93c5fd' : '#2563eb'
    },
    success: {
      bg: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5',
      border: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)',
      color: isDark ? '#34d399' : '#065f46',
      textMuted: isDark ? '#6ee7b7' : '#059669'
    },
    danger: {
      bg: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fff1f2',
      border: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.15)',
      color: isDark ? '#f87171' : '#991b1b',
      textMuted: isDark ? '#fca5a5' : '#e11d48'
    },
    warning: {
      bg: isDark ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb',
      border: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.15)',
      color: isDark ? '#fbbf24' : '#854d0e',
      textMuted: isDark ? '#fde047' : '#d97706'
    },
    analysis: {
      bg: isDark ? 'rgba(167, 139, 250, 0.12)' : '#faf5ff',
      border: isDark ? 'rgba(167, 139, 250, 0.25)' : 'rgba(167, 139, 250, 0.15)',
      color: isDark ? '#c084fc' : '#5b21b6',
      textMuted: isDark ? '#d8b4fe' : '#7c3aed'
    }
  };

  const style = stateStyles[type] || stateStyles.info;

  return (
    <div className="stat-card-inner" style={{ 
      backgroundColor: style.bg, 
      borderColor: style.border, 
      borderStyle: 'solid', 
      borderWidth: '1px'
    }}>
      <div className="stat-icon-wrapper" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
        {icon}
      </div>
      <div className="stat-info">
        <p style={{ color: style.textMuted, fontWeight: 600 }}>{label}</p>
        <h3 style={{ color: style.color, fontSize: '1.8rem', fontWeight: 800 }}>{value.toLocaleString()}</h3>
      </div>
    </div>
  );
}

// --- QUẢN LÝ NGƯỜI DÙNG ---
function UserManager({ user, apiFetch }) {
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [selectedAreas, setSelectedAreas] = useState([]);
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

  const isDark = localStorage.getItem('theme') === 'dark';
  const secondaryBtnStyle = {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
    color: isDark ? '#FAFAFA' : '#0F172A',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.06)',
  };

  // Tải danh sách khu vực
  const fetchLocations = async () => {
    try {
      const data = await apiFetch(`${API}/vi-tri`);
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải danh sách khu vực:", err);
    }
  };

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
    fetchLocations();
  }, []);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setSelectedAreas([]);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    if (!form.ho_ten || !form.ten_dang_nhap || (!editingId && !form.mat_khau)) {
      toast.error("Vui lòng nhập đầy đủ thông tin!")
      return;
    }

    try {
      const formData = {
        ...form,
        vi_tri_ids: selectedAreas
      };

      if (editingId) {
        await apiFetch(`${API}/nguoi-dung/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(formData)
        });
        toast.success("Cập nhật nhân viên thành công!")
      } else {
        await apiFetch(`${API}/nguoi-dung`, {
          method: "POST",
          body: JSON.stringify(formData)
        });
        toast.success("Thêm nhân viên thành công!")
      }
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error("Lỗi: " + error.message)
    }
  };

  const handleDelete = async (id) => {
    if (await confirmToast("Bạn có chắc chắn muốn xóa nhân viên này?")) {
      try {
        await apiFetch(`${API}/nguoi-dung/${id}`, { method: "DELETE" });
        toast.success("Xóa nhân viên thành công!")
        fetchUsers();
      } catch (error) {
        toast.error("Lỗi: " + error.message)
      }
    }
  };

  const handleEdit = async (userData) => {
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
    
    // Tải các khu vực của nhân viên
    try {
      const areasData = await apiFetch(`${API}/nhan-vien/${userData.id}/vi-tri`);
      const areaIds = Array.isArray(areasData) ? areasData.map(a => a.vi_tri_id) : [];
      setSelectedAreas(areaIds);
    } catch (err) {
      console.error("Lỗi tải khu vực của nhân viên:", err);
      setSelectedAreas([]);
    }
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
            
            {/* Chọn khu vực */}
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderRadius: '8px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500' }}>📍 Chọn khu vực làm việc</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                {locations.length === 0 ? (
                  <p style={{ color: '#94a3b8', gridColumn: '1 / -1' }}>Chưa có khu vực nào. Vui lòng tạo khu vực trước.</p>
                ) : (
                  locations.map(location => (
                    <label key={location.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', borderRadius: '6px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0') }}>
                      <input
                        type="checkbox"
                        checked={selectedAreas.includes(location.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAreas([...selectedAreas, location.id]);
                          } else {
                            setSelectedAreas(selectedAreas.filter(id => id !== location.id));
                          }
                        }}
                      />
                      <span style={{ fontSize: '14px' }}>{location.ten_vi_tri}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
              <button type="submit" className="confirm-btn" style={{ width: 'fit-content' }}>
                <Users size={18} style={{ marginRight: '8px' }} /> {editingId ? 'Cập nhật' : 'Thêm nhân viên'}
              </button>
              {editingId && (
                <button type="button" className="secondary-btn" style={secondaryBtnStyle} onClick={resetForm}>
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

  const isDark = localStorage.getItem('theme') === 'dark';
  const secondaryBtnStyle = {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
    color: isDark ? '#FAFAFA' : '#0F172A',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.06)',
  };

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
    const s = stock.find(st => st.id == productId); // ✅ API trả về 'id' không phải 'san_pham_id'
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

        <div className="xk-footer" style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button className="secondary-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', ...secondaryBtnStyle }} onClick={() => window.history.back()}>
            <ArrowLeft size={16} /> Trở về
          </button>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleSubmit}>
            <CheckCircle2 size={16} /> Xác nhận xuất kho
          </button>
        </div>
      </div>
    </div>
  );
}

