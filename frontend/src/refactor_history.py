import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the new component
new_lich_su = """function LichSuGiaoDich({ apiFetch }) {
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
}"""

# Use regex to find and replace the whole function LichSuGiaoDich
pattern = re.compile(r'function LichSuGiaoDich\(\{ apiFetch \}\) \{.*?\n\}\n(?=// --- QUẢN LÝ VỊ TRÍ)', re.DOTALL)
if pattern.search(content):
    content = pattern.sub(new_lich_su + '\n', content)
    with open('App.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced LichSuGiaoDich successfully")
else:
    print("Could not find LichSuGiaoDich")
