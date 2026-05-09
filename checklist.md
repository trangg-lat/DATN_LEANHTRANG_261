# 📋 CHECKLIST TIẾN ĐỘ ĐỒ ÁN TỐT NGHIỆP
**Đề tài:** Xây dựng hệ thống quản lý kho thông minh tích hợp AI dự đoán nhu cầu sản phẩm
**Sinh viên:** Lê Ánh Trang | **GVHD:** TS. Đỗ Oanh Cường

---

## 1. Về mặt hệ thống và nghiệp vụ
- [x] **Số hóa toàn diện quy trình kho:**
    - [x] Nhập kho (Đơn lẻ & Hàng loạt)
    - [x] Xuất kho (Đơn lẻ & Hàng loạt)
    - [x] Kiểm kê & Điều chỉnh tồn kho
    - [x] Chuyển kho nội bộ (Thay đổi vị trí kệ hàng)
- [x] **Quản trị danh mục:**
    - [x] Quản lý Sản phẩm (CRUD)
    - [x] Quản lý Nhà cung cấp (CRUD)
    - [x] Quản lý Vị trí kho/kệ hàng (CRUD)
- [x] **Phân quyền và bảo mật (RBAC):**
    - [x] Xác thực JWT (Login/Logout)
    - [x] Phân quyền vai trò: Admin, Quản lý, Nhân viên
    - [x] Chức năng Quản lý người dùng (Admin)
    - [x] Tự cập nhật thông tin cá nhân & đổi mật khẩu

## 2. Về mặt Trí tuệ nhân tạo (AI)
- [x] **Tiền xử lý dữ liệu chuỗi thời gian:**
    - [x] Gom nhóm dữ liệu theo tuần (Weekly aggregation)
    - [x] Xử lý dữ liệu thiếu, làm mượt dữ liệu
- [x] **Triển khai mô hình dự báo:**
    - [x] Linear Regression (Dự báo tuyến tính)
    - [x] ARIMA (Dự báo có tính chu kỳ/mùa vụ)
    - [x] LSTM - Deep Learning (Dự báo biến động phức tạp)
    - [x] ETS - Holt-Winters (Dự báo xu hướng & mùa vụ)
- [x] **Đánh giá và tối ưu:**
    - [x] Tính toán R2 Score cho từng mô hình
    - [x] Lưu trữ Metadata mô hình (Phiên bản, độ chính xác)
- [ ] **Mở rộng (Optional):**
    - [ ] Tích hợp biến ngoại vi (Lễ tết, khuyến mãi) - *Đã có cấu trúc nhưng chưa có dữ liệu thực tế*
    - [ ] Hiển thị chi tiết chỉ số MAE/RMSE trên giao diện (Hiện mới hiển thị R2)

## 3. Hỗ trợ quyết định (Decision Support)
- [x] **Dashboard trực quan hóa:**
    - [x] Biểu đồ xu hướng tồn kho (Area Chart)
    - [x] Biểu đồ so sánh Nhập/Xuất (Bar Chart)
    - [x] Biểu đồ cơ cấu sản phẩm (Pie Chart)
    - [x] Heatmap giao dịch theo thời gian
- [x] **Cơ chế gợi ý nhập hàng:**
    - [x] Tính toán Điểm đặt hàng lại (Reorder Point - ROP)
    - [x] Tính toán Tồn kho an toàn (Safety Stock)
- [x] **Phân loại hàng hóa ABC/XYZ:**
    - [x] Phân loại ABC dựa trên sản lượng/giá trị
    - [x] Phân loại XYZ dựa trên độ biến động nhu cầu

## 4. Thiết kế Cơ sở dữ liệu & Kiến trúc
- [x] **Mô hình dữ liệu (RDBMS):**
    - [x] Bảng Products, Transactions, Suppliers
    - [x] Bảng Inventory_Snapshots (Lưu lịch sử tồn kho)
    - [x] Bảng AI_Models_Metadata
- [x] **Kiến trúc hệ thống:**
    - [x] Backend RESTful API (Node.js)
    - [x] AI Microservice (Python Flask)
    - [x] Frontend Single Page Application (React)
- [x] **Tự động hóa:**
    - [x] Cron Job chụp ảnh tồn kho cuối ngày (EOD Snapshots)

## 5. Kết quả dự kiến & Hoàn thiện
- [x] Hệ thống chạy ổn định trên Web
- [x] Giao diện Dashboard chuyên nghiệp, hiện đại
- [x] Chức năng xuất báo cáo (PDF, Excel/CSV)
- [ ] **Báo cáo đồ án (Word/PDF):**
    - [ ] Hoàn thiện nội dung lý thuyết
    - [ ] Viết chương thực nghiệm & đánh giá kết quả
    - [ ] Kết luận & hướng phát triển

---

### 🚩 Ghi chú các mục cần lưu ý:
1. **Lịch sử giao dịch:** Bạn đã có trang hiển thị lịch sử 500 giao dịch gần nhất kèm chức năng Xuất CSV.
2. **Snapshot AI:** Đã tích hợp cả cơ chế tự động (Cron) và thủ công (Nút bấm trên Dashboard).
3. **Phân loại:** Đã có nút "Cập nhật ABC" để tính toán lại phân loại dựa trên dữ liệu mới nhất.
4. **Dữ liệu:** Đã có file `fake_data.sql` cực kỳ chất lượng để demo tính năng AI (có tính mùa vụ).

**Tổng kết:** Về mặt **CODE**, bạn đã hoàn thành **98%** yêu cầu. Phần còn lại chủ yếu là tinh chỉnh giao diện và hoàn thiện văn bản báo cáo.
