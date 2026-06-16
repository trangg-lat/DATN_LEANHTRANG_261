# 🎯 Hướng Dẫn: Thêm Khu Vực Làm Việc Cho Nhân Viên

## ✅ Tính năng mới
Khi thêm hoặc cập nhật nhân viên, bạn giờ có thể chọn các **khu vực** mà nhân viên đó làm việc.

## 📋 Các bước cài đặt

### Bước 1: Tạo bảng cơ sở dữ liệu
Chạy SQL script để tạo bảng liên kết nhân viên-khu vực:

```sql
CREATE TABLE IF NOT EXISTS nhan_vien_vi_tri (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nhan_vien_id INT NOT NULL,
    vi_tri_id INT NOT NULL,
    ngay_phan_cong DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nhan_vien_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    FOREIGN KEY (vi_tri_id) REFERENCES vi_tri_kho(id) ON DELETE CASCADE,
    UNIQUE KEY unique_nhan_vien_vi_tri (nhan_vien_id, vi_tri_id)
);
```

**Cách thực hiện:**
1. Mở MySQL Workbench hoặc công cụ quản lý MySQL
2. Chọn database `quanly_kho`
3. Copy-paste đoạn SQL trên vào và chạy (Ctrl+Enter)

### Bước 2: Khởi động lại Backend
```bash
cd d:\DATN_261\ĐATN
node server.js
```

### Bước 3: Refresh Frontend
- Reload trang trong trình duyệt (F5 hoặc Ctrl+R)

## 🚀 Cách sử dụng

### Thêm Nhân Viên Mới:
1. Vào **Quản Lý Người Dùng** (User Management)
2. Điền thông tin nhân viên:
   - Họ Tên
   - Vai Trò (Nhân viên, Quản lý, Admin)
   - Tên Đăng Nhập
   - Mật Khẩu
3. **Cuộn xuống** để thấy section: **📍 Chọn khu vực làm việc**
4. Chọn các khu vực mà nhân viên sẽ làm việc (click checkbox)
5. Click "Thêm nhân viên"

### Cập Nhật Khu Vực:
1. Click vào nút **Sửa** (Edit icon) tại dòng nhân viên
2. Form sẽ hiện những khu vực hiện tại của nhân viên (đã ticked)
3. Thay đổi lựa chọn khu vực nếu cần
4. Click "Cập nhật"

## 📊 Dữ liệu được lưu

- **Bảng:** `nhan_vien_vi_tri`
- **Các trường:**
  - `nhan_vien_id`: ID của nhân viên
  - `vi_tri_id`: ID của khu vực
  - `ngay_phan_cong`: Ngày gán (tự động)

## 🔧 API Endpoints

### Lấy danh sách khu vực của nhân viên
```
GET /nhan-vien/:id/vi-tri
```
Response:
```json
[
  { "id": 1, "vi_tri_id": 1, "ten_vi_tri": "Khu A - Kệ 1", "mo_ta": "..." },
  { "id": 2, "vi_tri_id": 3, "ten_vi_tri": "Khu C", "mo_ta": "..." }
]
```

### Cập nhật khu vực cho nhân viên
```
POST /nhan-vien/:id/vi-tri
Body: { "vi_tri_ids": [1, 3, 5] }
```

## ⚠️ Lưu ý

- Phải tạo **khu vực** trước ở **Quản lý vị trí kệ hàng** (Location Manager)
- Nếu xóa nhân viên, tất cả khu vực gán sẽ tự động xóa
- Nếu xóa khu vực, tất cả nhân viên gán sẽ bị gỡ khỏi khu vực đó
- Một nhân viên không thể được gán cùng 1 khu vực 2 lần (UNIQUE constraint)

## 🐛 Troubleshooting

**Lỗi: "Chưa có khu vực nào"**
→ Bạn phải tạo khu vực trước ở "Quản lý vị trí kệ hàng"

**Lỗi: "Lỗi tải danh sách khu vực"**
→ Backend không chạy. Hãy kiểm tra server

**Form không hiện checkbox**
→ Reload F5 và xóa browser cache

---

**Tất cả đã sẵn sàng! Bắt đầu dùng ngay! 🎉**
