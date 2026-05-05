import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Box, Warehouse, ArrowDownCircle,
  ArrowUpCircle, ClipboardCheck, BrainCircuit,
  BarChart3, LogOut, UserCircle, Users, Edit, Trash2,
  ShoppingCart, AlertTriangle, FileSpreadsheet, FileText,
  Search, ArrowLeft, CheckCircle2, Plus, PlusCircle, Save,
  TrendingUp, Loader2, Sparkles, PackageCheck, PackageMinus, PackageX
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import "./App.css";

// const API = "http://localhost:3000";
const API = "https://eleven-clowns-wink.loca.lt"; // Public URL via localtunnel

const lineDataSample = [
  { name: '1/10', uv: 200 }, { name: '15/10', uv: 300 }, { name: '30/10', uv: 400 }
];
const barDataSample = [
  { name: 'T2', nhap: 120, xuat: 80 }, { name: 'T3', nhap: 150, xuat: 100 }
];

// --- THÀNH PHẦN TOP HEADER CHUNG ---
function TopHeader() {
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
        <UserCircle size={28} />
      </div>
    </header>
  );
}

export default function App() {
  // Lấy thông tin user từ localStorage để tránh mất dữ liệu khi refresh trang (F5)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

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
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Lỗi kết nối server!");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <Router>
      <div className="font-sans antialiased">
        <TopHeader />
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

                <button onClick={handleLogout} className="btn-logout">
                  <LogOut size={20} /> Đăng xuất
                </button>
              </nav>
            </aside>

            {/* --- NỘI DUNG CHÍNH --- */}
            <main className="content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/san-pham" element={<SanPhamManager user={user} />} />
                <Route path="/ton-kho" element={<TonKhoManager user={user} />} />
                <Route path="/nhap-kho" element={<NhapKhoManager user={user} />} />
                <Route path="/nguoi-dung" element={user.vai_tro === "admin" ? <UserManager user={user} /> : <Navigate to="/" />} />
                <Route path="/xuat-kho" element={<XuatKhoManager user={user} />} />
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
function SanPhamManager({ user }) {
  const [list, setList] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [form, setForm] = useState({ ten_san_pham: "", danh_muc: "", gia: "", don_vi: "" });

  const fetchAll = () => {
    fetch(`${API}/san-pham`)
      .then(res => res.json())
      .then(data => setList(Array.isArray(data) ? data : []))
      .catch(err => console.error("Lỗi tải sản phẩm:", err));
  };

  useEffect(() => fetchAll(), []);

  // Hàm xử lý Xóa sản phẩm chuẩn hóa
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;

    try {
      const res = await fetch(`${API}/san-pham/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        fetchAll(); // Thành công thì cập nhật lại danh sách
      } else {
        const errorData = await res.json();
        // Báo lỗi cụ thể từ Server (ví dụ: Sản phẩm đang có trong kho nên không thể xóa)
        alert("Lỗi: " + (errorData.message || "Không thể xóa sản phẩm này vì có dữ liệu liên quan trong kho!"));
      }
    } catch (error) {
      alert("Lỗi kết nối server!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `${API}/san-pham/${isEditing}` : `${API}/san-pham`;
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setForm({ ten_san_pham: "", danh_muc: "", gia: "", don_vi: "" });
        setIsEditing(null);
        fetchAll();
      }
    } catch (error) {
      alert("Không thể lưu sản phẩm");
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
                {user.vai_tro === "admin" && <th>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {list.map(item => (
                <tr key={item.id}>
                  <td className="font-medium">{item.ten_san_pham}</td>
                  <td className="text-muted">{item.danh_muc}</td>
                  <td className="text-muted">{item.don_vi || "---"}</td>
                  <td className="font-bold">{Number(item.gia).toLocaleString()}đ</td>
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
function TonKhoManager({ user }) {
  const [list, setList] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockForm, setStockForm] = useState({ san_pham_id: "", so_luong: "", loai: "nhap" });

  const fetchStock = () => fetch(`${API}/ton-kho`).then(res => res.json()).then(data => setList(Array.isArray(data) ? data : []));
  const fetchProducts = () => fetch(`${API}/san-pham`).then(res => res.json()).then(data => setProducts(Array.isArray(data) ? data : []));

  useEffect(() => { fetchStock(); fetchProducts(); }, []);

  const handleStockAction = async (e) => {
    e.preventDefault();
    const endpoint = stockForm.loai === "nhap" ? "nhap-kho" : "xuat-kho";
    await fetch(`${API}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ san_pham_id: stockForm.san_pham_id, so_luong: Number(stockForm.so_luong) })
    });
    setStockForm({ ...stockForm, so_luong: "" });
    fetchStock();
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
function NhapKhoManager({ user }) {
  const [products, setProducts] = useState([]);
  const [supplier, setSupplier] = useState("");
  const [items, setItems] = useState([
    { id: Date.now(), san_pham_id: "", so_luong: 1, don_gia: 0 }
  ]);

  const [suppliers, setSuppliers] = useState([]);

  const fetchProducts = () => fetch(`${API}/san-pham`).then(res => res.json()).then(data => setProducts(Array.isArray(data) ? data : []));
  const fetchSuppliers = () => fetch(`${API}/nha-cung-cap`).then(res => res.json()).then(data => setSuppliers(Array.isArray(data) ? data : []));

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
      const res = await fetch(`${API}/nha-cung-cap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ten_ncc, lien_he, dia_chi })
      });
      if (res.ok) {
        fetchSuppliers();
        alert("Đã thêm Nhà cung cấp mới thành công!");
      } else {
        alert("Lỗi khi thêm nhà cung cấp");
      }
    } catch (err) {
      alert("Không thể kết nối đến server");
    }
  };

  const handleSubmit = async () => {
    if (!supplier) return alert("Vui lòng chọn nhà cung cấp!");
    if (items.some(i => !i.san_pham_id || i.so_luong <= 0)) {
      return alert("Vui lòng chọn sản phẩm và số lượng hợp lệ cho tất cả các dòng!");
    }

    try {
      const res = await fetch(`${API}/nhap-kho-hang-loat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, supplier_id: supplier })
      });
      if (res.ok) {
        alert("Đã lưu thông tin nhập kho thành công!");
        setItems([{ id: Date.now(), san_pham_id: "", so_luong: 1, don_gia: 0 }]);
        setSupplier("");
      } else {
        const errorData = await res.json();
        alert("Lỗi: " + (errorData.message || "Không thể thực hiện nhập kho"));
      }
    } catch (error) {
      alert("Lỗi kết nối server!");
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

// Dashboard (Đã gộp Báo Cáo + Dự báo AI)
function Dashboard() {
  const [stats, setStats] = useState({ tongSanPham: 0, tongTonKho: 0, sapHetHang: 0, doiTac: 0, aiDuBao: 0 });
  const [chartData, setChartData] = useState(lineDataSample);
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);

  // State cho AI Prediction
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);
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

  useEffect(() => {
    // Lấy tổng sản phẩm
    fetch(`${API}/san-pham`).then(res => res.json()).then(data => {
      const prods = Array.isArray(data) ? data : [];
      setProducts(prods);
      setStats(prev => ({ ...prev, tongSanPham: prods.length }));
    });

    // Lấy tồn kho và tính toán
    fetch(`${API}/ton-kho`).then(res => res.json()).then(data => {
      const st = Array.isArray(data) ? data : [];
      setStock(st);
      const total = st.reduce((sum, item) => sum + (Number(item.so_luong) || 0), 0);
      const lowStock = st.filter(item => item.so_luong < 10).length;
      setStats(prev => ({ ...prev, tongTonKho: total, sapHetHang: lowStock }));

      // Đưa dữ liệu thật vào biểu đồ vùng
      const formatted = st.slice(0, 7).map(item => ({
        name: item.ten_san_pham.substring(0, 5),
        uv: item.so_luong
      }));
      if (formatted.length > 0) setChartData(formatted);

    });

    // Lấy số lượng đối tác
    fetch(`${API}/nha-cung-cap`).then(res => res.json()).then(data => {
      setStats(prev => ({ ...prev, doiTac: data.length }));
    });
    // Lấy dữ liệu dự báo từ AI Server
    fetch('http://127.0.0.1:5000/predict')
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setStats(prev => ({ ...prev, aiDuBao: data.predicted_value }));
        }
      })
      .catch(err => console.log("Lỗi AI: ", err));
  }, []);

  const categoryData = products.reduce((acc, current) => {
    const cat = current.danh_muc || "Khác";
    const existing = acc.find(i => i.name === cat);
    if (existing) existing.value += 1;
    else acc.push({ name: cat, value: 1 });
    return acc;
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="dashboard-wrapper fade-in" style={{ paddingBottom: '40px' }}>
      <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Dashboard & Báo Cáo Thống Kê</h2>
        <div className="report-actions" style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-base btn-excel" style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}><FileSpreadsheet size={16} /> Xuất Excel</button>
          <button className="btn-base btn-pdf" style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}><FileText size={16} /> Xuất PDF</button>
        </div>
      </div>

      <div className="stat-cards">
        <StatItem icon={<Box size={24} color="#3b82f6" />} label="Sản phẩm" value={stats.tongSanPham} bg="#eff6ff" />
        <StatItem icon={<ShoppingCart size={24} color="#10b981" />} label="Tổng tồn" value={stats.tongTonKho} bg="#ecfdf5" />
        <StatItem icon={<AlertTriangle size={24} color="#ef4444" />} label="Cảnh báo hàng" value={stats.sapHetHang} bg="#fff1f2" />
        <StatItem icon={<Users size={24} color="#f59e0b" />} label="Nhà cung cấp" value={stats.doiTac} bg="#fffbeb" />
      </div>

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

          <button
            onClick={async () => {
              setAiLoading(true);
              setAiError(null);
              try {
                const res = await fetch('https://solid-maps-agree.loca.lt/predict-all');
                const data = await res.json();
                if (data.status === 'success') {
                  setAiResult(data);
                } else {
                  setAiError(data.message || 'Lỗi không xác định từ AI server');
                }
              } catch (err) {
                setAiError('Không thể kết nối đến AI Server (port 5000). Hãy đảm bảo đã chạy: python AI/main.py');
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
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tồn kho</th>
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
                          <span style={{ background: 'rgba(96,165,250,0.15)', padding: '4px 10px', borderRadius: '6px', color: '#93c5fd', fontWeight: 600 }}>
                            {item.ton_kho_hien_tai}
                          </span>
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
function UserManager({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    ho_ten: "",
    vai_tro: "nhan_vien",
    ten_dang_nhap: "",
    mat_khau: "",
    quyen_xem: true,
    quyen_sua: false,
    quyen_xoa: false
  });

  // Tải danh sách nhân viên từ database
  const fetchUsers = () => {
    fetch(`${API}/nguoi-dung`)
      .then(res => res.json())
      .then(data => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi tải danh sách nhân viên:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.ho_ten || !form.ten_dang_nhap || !form.mat_khau) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      const res = await fetch(`${API}/nguoi-dung`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        alert("Thêm nhân viên thành công!");
        setForm({
          ho_ten: "",
          vai_tro: "nhan_vien",
          ten_dang_nhap: "",
          mat_khau: "",
          quyen_xem: true,
          quyen_sua: false,
          quyen_xoa: false
        });
        fetchUsers();
      } else {
        const errorData = await res.json().catch(() => ({ message: "Lỗi Server không xác định" }));
        alert("Lỗi: " + (errorData.message || "Không thể thêm nhân viên"));
      }
    } catch (error) {
      console.error("Lỗi khi thêm nhân viên:", error);
      alert("Lỗi kết nối đến server!");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
      try {
        const res = await fetch(`${API}/nguoi-dung/${id}`, {
          method: "DELETE"
        });

        if (res.ok) {
          alert("Xóa nhân viên thành công!");
          fetchUsers();
        } else {
          alert("Lỗi khi xóa nhân viên");
        }
      } catch (error) {
        alert("Lỗi kết nối đến server!");
      }
    }
  };

  return (
    <div className="fade-in user-manager-container">
      <div className="um-header">
        <h2>Quản Lý Người Dùng</h2>
      </div>

      <div className="manager-layout">
        {/* --- FORM THÊM NHÂN VIÊN --- */}
        {user?.vai_tro === 'admin' && (
          <form className="glass-card user-form" onSubmit={handleAdd}>
            <h4>Thêm nhân viên mới</h4>
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
                  required
                />
              </div>
            </div>
            <button type="submit" className="confirm-btn mt-4" style={{ width: 'fit-content' }}>
              <Users size={18} style={{ marginRight: '8px' }} /> Thêm nhân viên
            </button>
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
                          {u.vai_tro !== "admin" && (
                            <button
                              className="delete-btn"
                              onClick={() => handleDelete(u.id)}
                              title="Xóa nhân viên"
                              style={{ margin: '0 auto' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
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
function XuatKhoManager({ user }) {
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState("");
  const [items, setItems] = useState([
    { id: 1, san_pham_id: "", so_luong_xuat: 300 }
  ]);

  const fetchStock = () => {
    fetch(`${API}/ton-kho`).then(res => res.json()).then(data => setStock(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    fetch(`${API}/san-pham`).then(res => res.json()).then(data => setProducts(Array.isArray(data) ? data : []));
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
    if (!customer) return alert("Vui lòng chọn khách hàng!");
    if (items.some(i => !i.san_pham_id || i.so_luong_xuat <= 0)) {
      return alert("Vui lòng chọn sản phẩm và số lượng hợp lệ!");
    }

    // Kiểm tra tồn kho trước khi gửi
    for (const item of items) {
      const theory = getTheoreticalStock(item.san_pham_id);
      if (theory < item.so_luong_xuat) {
        return alert(`Sản phẩm với ID ${item.san_pham_id} không đủ tồn kho để xuất!`);
      }
    }

    try {
      const res = await fetch(`${API}/xuat-kho-hang-loat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, customer_id: customer })
      });

      if (res.ok) {
        alert("Đã xác nhận xuất kho thành công!");
        setItems([{ id: Date.now(), san_pham_id: "", so_luong_xuat: 0 }]);
        setCustomer("");
        fetchStock(); // Cập nhật lại tồn kho hiển thị
      } else {
        const errorData = await res.json();
        alert("Lỗi: " + (errorData.message || "Không thể thực hiện xuất kho"));
      }
    } catch (error) {
      alert("Lỗi kết nối server!");
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

