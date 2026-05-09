# Checklist dự án quản lý kho thông minh

## ✅ Đã hoàn thành theo code hiện tại

- [x] Backend `ĐATN/server.js` có API cơ bản và mở rộng:
  - [x] `POST /login`
  - [x] `GET /nguoi-dung`
  - [x] `POST /nguoi-dung`
  - [x] `PUT /nguoi-dung/:id`
  - [x] `DELETE /nguoi-dung/:id`
  - [x] `PUT /me`
  - [x] `GET /san-pham`
  - [x] `POST /san-pham`
  - [x] `GET /san-pham/:id`
  - [x] `PUT /san-pham/:id`
  - [x] `DELETE /san-pham/:id`
  - [x] `GET /ton-kho`
  - [x] `POST /nhap-kho`
  - [x] `POST /xuat-kho`
  - [x] `POST /nhap-kho-hang-loat`
  - [x] `POST /xuat-kho-hang-loat`
  - [x] `GET /nha-cung-cap`
  - [x] `POST /nha-cung-cap`
  - [x] `GET /lich-su-giao-dich`
  - [x] `GET /dashboard-stats`
- [x] Frontend `frontend/src/App.jsx` có:
  - [x] Login và lưu `user` + `token` vào `localStorage`
  - [x] Sidebar điều hướng Dashboard, Sản phẩm, Tồn kho, Nhập kho, Xuất kho, Người dùng
  - [x] Quản lý sản phẩm: xem, thêm, sửa, xóa
  - [x] Quản lý tồn kho: xem tồn kho, nhập/xuất nhanh
  - [x] Nhập kho hàng loạt với chọn nhà cung cấp
  - [x] Xuất kho với kiểm tra tồn kho trước khi gửi request
  - [x] Dashboard có biểu đồ và thống kê cơ bản
  - [x] Dashboard có nút gọi AI report và lưu snapshot kho
  - [x] Quản lý người dùng cơ bản và sửa user
  - [x] Cập nhật thông tin cá nhân qua `/me`
- [x] AI server `AI/main.py` có:
  - [x] `GET /predict`
  - [x] `GET /predict-all`
  - [x] `GET /ai-report`
  - [x] `POST /snapshot-inventory`
  - [x] `POST /classify-abc`
  - [x] dự báo nhu cầu 30 ngày, tính `reorder_point` và trạng thái kho
- [x] Authentication & authorization đã có:
  - [x] JWT auth backend
  - [x] `requireAuth` middleware bảo vệ route
  - [x] `requireRole` phân quyền `admin`, `quan_ly`, `nhan_vien`
  - [x] Hash mật khẩu và migration password legacy
- [x] Có file giả lập dữ liệu `AI/fake_data.sql` và script DB `AI/db_update.py`

## ❌ Chưa hoàn thành theo code hiện tại

- [x] Export Excel/PDF chỉ mới UI, chưa có chức năng thực tế
- [x] Không có UI riêng để hiển thị lịch sử giao dịch, mặc dù backend có route `/lich-su-giao-dich`
- [x] Chưa có hiển thị rõ ABC/XYZ trong dashboard frontend
- [ ] AI chỉ là prototype, chưa có LSTM hoặc Prophet/ARIMA tuning đầy đủ
- [ ] Chưa có xử lý mùa vụ / biến ngoại vi thực tế ngoài dữ liệu giả lập
- [ ] Cần kiểm tra schema MySQL và đảm bảo các bảng/cột đúng với database sản phẩm
- [x] Cần xác nhận backend chính đang là `ĐATN/server.js`; `frontend/backend/server.js` là phiên bản cũ
- [x] Cần sửa lỗi môi trường frontend nếu `npm run dev` không chạy
- [x] Cần kiểm tra backend `ĐATN/server.js` có chạy ổn định không

---

> Ghi chú: phần "chưa hoàn thành" ở đây là những chức năng hoặc hiển thị mà code hiện tại chưa hoàn thiện hoặc chưa được xác thực. Nếu bạn muốn, tôi có thể tiếp tục tách thêm dòng thành `Đã có code` và `Cần làm thêm` theo từng phần Backend/Frontend/AI.