# ✅ CHECKLIST CÔNG VIỆC ĐÃ HOÀN THÀNH

**Sinh viên:** Lê Ánh Trang | **Mã SV:** 2251162179

---

## GIAI ĐOẠN 1: PHÂN TÍCH & THIẾT KẾ

- [x] Khảo sát các hạn chế của quản lý thủ công
- [x] Phân tích yêu cầu và đặc tả Use Case
- [x] Nhập kho
- [x] Xuất kho
- [x] Kiểm kê
- [x] Chuyển kho nội bộ
- [x] Thủ kho
- [x] Kế toán kho
- [x] Nhà quản lý
- [x] Admin
- [x] Thiết kế CSDL quan hệ (MySQL)
- [x] Tạo bảng: `san_pham`
- [x] Tạo bảng: `giao_dich`
- [x] Tạo bảng: `inventory_snapshots`
- [x] Tạo bảng: `ai_models_metadata`
- [x] Tạo bảng: `ton_kho`
- [x] Tạo bảng: `nguoi_dung`
- [x] Thiết kế phân loại ABC/XYZ
- [x] Cột `phan_loai_abc` trong bảng `san_pham`
- [x] Thu thập dữ liệu nhập-xuất kho
- [x] Thu thập dữ liệu doanh số
- [x] Sinh dữ liệu mô phỏng: 100 sản phẩm
- [x] 8 loại danh mục
- [x] Lịch sử 6 tháng (180 ngày)
- [x] Các mức nhu cầu khác nhau
- [x] Xử lý dữ liệu chuỗi thời gian

## GIAI ĐOẠN 2: MODULE CỐT LỐI & API

- [x] Thiết lập Express server
- [x] Kết nối MySQL2 database
- [x] API nhập kho
- [x] API xuất kho
- [x] API kiểm kê
- [x] API chuyển kho nội bộ
- [x] API quản lý sản phẩm
- [x] API quản lý danh mục
- [x] Xây dựng hệ thống Login
- [x] JWT Token
- [x] Xây dựng RBAC
- [x] Middleware `requireAuth()`
- [x] Middleware `requireRole()`
- [x] Mã hóa mật khẩu với bcryptjs
- [x] Migration mật khẩu plaintext
- [x] Quản lý người dùng với quyền
- [x] quyen_xem
- [x] quyen_sua
- [x] quyen_xoa
- [x] Thiết lập React 19 + Vite
- [x] Cấu hình React Router v7
- [x] Tạo giao diện Login/Authentication
- [x] JWT token lưu trong localStorage
- [x] Auto-attach token vào mọi request
- [x] Xử lý session hết hạn (401 Unauthorized)
- [x] Dashboard chính
- [x] Navigation menu
- [x] User profile area
- [x] Logout functionality
- [x] Form nhập kho
- [x] Form xuất kho
- [x] Form kiểm kê
- [x] Giao diện quản lý danh mục
- [x] Quản lý sản phẩm
- [x] Quản lý nhà cung cấp
- [x] Lucide React icons
- [x] React Hot Toast notifications
- [x] Recharts cho biểu đồ
- [x] jsPDF + jspdf-autotable for PDF export
- [x] CSS styling
- [x] Giao diện responsive

## GIAI ĐOẠN 3: AI & DỰ BÁO

- [x] Flask app
- [x] Flask-CORS
- [x] Kết nối MySQL database từ Python
- [x] `ai_models_metadata`
- [x] `inventory_snapshots`
- [x] Làm sạch dữ liệu
- [x] Xử lý loại bỏ nhiễu
- [x] Xử lý tính mùa vụ
- [x] Làm mượt dữ liệu
- [x] Trích xuất đặc trưng
- [x] Mô hình Linear Regression
- [x] Mô hình ARIMA
- [x] Statsmodels ARIMA
- [x] Exponential Smoothing
- [x] Mô hình LSTM
- [x] TensorFlow/Keras
- [x] Chuẩn bị dữ liệu với Sliding Window
- [x] Layer: LSTM, Dense, Dropout
- [x] Tính toán MAE
- [x] Tính toán RMSE
- [x] Tính toán R² Score
- [x] So sánh kết quả thực tế vs dự báo
- [x] Xử lý lỗi an toàn
- [x] Đóng gói mô hình Python dưới dạng Microservice
- [x] Tạo API endpoints cho dự báo
- [x] Gợi ý nhập hàng dựa trên AI
- [x] Tính toán Reorder Point

## GIAI ĐOẠN 4: DASHBOARD & VISUALIZATION

- [x] Dashboard hiển thị tình trạng tồn kho
- [x] LineChart
- [x] AreaChart
- [x] BarChart
- [x] PieChart
- [x] ComposedChart
- [x] Kết quả dự đoán AI
- [x] Bản đồ nhiệt (Heatmap)
- [x] Biểu đồ so sánh nhu cầu thực tế vs dự báo
- [x] Cơ chế cảnh báo hàng tới hạn sử dụng
- [x] Cơ chế cảnh báo hàng sắp hết
- [x] Thông báo gợi ý nhập hàng
- [x] Toast notifications
- [x] Xuất CSV
- [x] Xuất PDF
- [x] Format tiêu đề và dữ liệu báo cáo

## GIAI ĐOẠN 5: HOÀN THIỆN & KIỂM THỬ

- [x] Kiểm thử chức năng cơ bản
- [x] Kiểm thử tích hợp
- [x] Kiểm thử xác thực & phân quyền
- [x] Kiểm thử hiệu suất dự báo
- [x] Kiểm thử bảo mật
- [x] Xử lý lỗi toàn bộ
- [x] Tài liệu kỹ thuật
- [x] Hướng dẫn sử dụng
- [x] ERD
- [x] Biểu đồ đặc tả
- [x] Phiếu đánh giá tiến độ
- [x] Báo cáo đồ án
- [x] Cấu hình môi trường production
- [x] Hướng dẫn chạy backend
- [x] Hướng dẫn chạy frontend
- [x] Hướng dẫn chạy AI server
- [x] Script sinh dữ liệu fake
- [x] Script cập nhật database

## CÔNG NGHỆ SỬ DỤNG

- [x] React 19.2.4
- [x] Vite 8.0.4
- [x] React Router v7
- [x] Recharts 3.8.1
- [x] Lucide React
- [x] React Hot Toast
- [x] jsPDF + jspdf-autotable
- [x] Node.js + Express 5.2.1
- [x] MySQL2 3.20.0
- [x] JWT
- [x] bcryptjs
- [x] CORS
- [x] node-cron
- [x] Body Parser
- [x] Python 3.x
- [x] Flask + Flask-CORS
- [x] Scikit-learn
- [x] Statsmodels
- [x] TensorFlow/Keras
- [x] Pandas + NumPy
- [x] MySQL Connector
- [x] MySQL 5.7+
- [x] Database: `quanly_kho`

## KỲ VỌNG KẾT QUẢ

- [x] Hệ thống quản lý kho hoàn chỉnh trên web
- [x] Mô hình AI dự đoán
- [x] Dashboard trực quan
- [x] Hỗ trợ quyết định nhập hàng
- [x] Phân quyền RBAC
- [x] Xác thực JWT
- [x] Báo cáo (PDF, CSV)
- [x] Tài liệu kỹ thuật

---

**Tổng cộng: 150+ công việc hoàn thành ✅**

**Trạng thái: 100% HOÀN THÀNH 🚀**
