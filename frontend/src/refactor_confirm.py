import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

confirm_util = """
const confirmToast = (message) => new Promise((resolve) => {
  toast((t) => (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>⚠️ {message}</p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button className="confirm-btn" style={{ padding: '6px 16px', fontSize: '13px', background: '#ef4444' }} onClick={() => { toast.dismiss(t.id); resolve(true); }}>Xóa</button>
        <button className="secondary-btn" style={{ padding: '6px 16px', fontSize: '13px' }} onClick={() => { toast.dismiss(t.id); resolve(false); }}>Hủy</button>
      </div>
    </div>
  ), { duration: Infinity, style: { border: '1px solid #fecaca', padding: '16px', color: '#b91c1c' } });
});
"""

if 'const confirmToast =' not in content:
    content = content.replace('const API = "http://localhost:3000";', confirm_util + '\nconst API = "http://localhost:3000";')

# Replace window.confirm with await confirmToast
content = content.replace('window.confirm(', 'await confirmToast(')

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added confirmToast and replaced window.confirm")
