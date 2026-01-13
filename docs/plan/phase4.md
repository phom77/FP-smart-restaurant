# 🚀 PHASE 4: SYSTEM COMPLETION & ADVANCED FEATURES


## 👤 THÀNH VIÊN 1 (LEADER): System Core, Email Service & DevOps
*Trách nhiệm: Xử lý các luồng nghiệp vụ nền tảng phức tạp và cấu hình hệ thống.*

### 🛠 Backend (Node.js - Heavy Logic)

1.  **Email Service (Tính năng mới - Quan trọng):**
    * Cấu hình **Nodemailer** (hoặc SendGrid/Mailgun).
    * **API Forgot Password:** Gửi email chứa link reset token (có thời hạn hết hạn).
    * **API Verify Email:** Gửi email xác thực kèm OTP/Link khi khách đăng ký tài khoản mới.

2.  **System Configuration API (Super Admin):**
    * Tạo bảng `system_settings` (Key-Value store).
    * **API CRUD cấu hình toàn hệ thống:** Tên nhà hàng, Logo, Thuế VAT mặc định, Giờ đóng/mở cửa, Wifi Password.
    * **Logic:** Các cấu hình này phải được **Cache (Redis)** để không query DB liên tục mỗi khi F5 trang.

3.  **Account Management Flow (Super Admin):**
    * API để Super Admin tạo tài khoản cho **Restaurant Admin** (Chủ nhà hàng).
    * API Khóa/Mở khóa tài khoản (Ban user/Staff).

### 💻 Frontend (React)

1.  **Auth Flow Nâng cao:**
    * Màn hình "Quên mật khẩu" (Nhập email) & "Đặt lại mật khẩu" (Nhập pass mới từ link email).
    * Màn hình "Xác thực Email" (Nhập OTP).

2.  **System Settings UI:**
    * Form cấu hình hệ thống (Chỉ Super Admin thấy).
    * Cho phép upload Logo nhà hàng.

---

## 👤 THÀNH VIÊN 2: Customer Account & Social Authentication
*Trách nhiệm: Quản lý thông tin cá nhân, bảo mật tài khoản và đăng nhập nhanh.*

### 🛠 Backend (Node.js)

1.  **User Profile API:**
    * **PUT `/api/users/profile`:** Cho phép cập nhật tên hiển thị, avatar, số điện thoại. (Validate số điện thoại đúng định dạng).
    * **PUT `/api/users/password`:** Đổi mật khẩu (Yêu cầu nhập mật khẩu cũ để xác minh).

2.  **Social Login (Google/Facebook):**
    * Cài đặt thư viện `passport` và `passport-google-oauth20`.
    * **API `GET /auth/google`:** Redirect người dùng sang trang đăng nhập Google.
    * **API `GET /auth/google/callback`:** Xử lý dữ liệu Google trả về.
    * **Logic:**
        * Check email từ Google.
        * Nếu chưa có trong DB -> Tự động tạo user mới (Role: Customer).
        * Nếu có rồi -> Tạo JWT Token và Đăng nhập luôn.

### 💻 Frontend (React)

1.  **Trang Cá nhân (Profile Page):**
    * Hiển thị thông tin user hiện tại.
    * **Form sửa thông tin:** Upload Avatar mới, sửa tên/sđt.
    * **Form đổi mật khẩu:** Validate mật khẩu mới và nhập lại phải khớp nhau.


2.  **Login Page Integration:**
    * Thêm nút **"Đăng nhập bằng Google"** đẹp mắt.
    * Xử lý lưu Token khi Google redirect về lại trang web.

---

## 👤 THÀNH VIÊN 3: QR Code, Table & Advanced Reporting
*Trách nhiệm: Quản lý tài nguyên vật lý (Bàn/QR) và Báo cáo số liệu chuyên sâu.*

### 🛠 Backend (Node.js - Library Heavy)

1.  **QR Code Generator (Nhiệm vụ chính):**
    * Sử dụng thư viện `qrcode` để tạo mã từ Token bàn ăn.
    * **Nâng cao:** Sử dụng `pdfkit` để vẽ file PDF chứa: Mã QR, Số bàn to rõ, Logo nhà hàng, Hướng dẫn "Quét để gọi món".
    * Mục đích: Giúp Admin tải về và in ra giấy dán lên bàn ngay lập tức.

2.  **Staff Management:**
    * API CRUD nhân viên (Waiter/Kitchen).
    * Logic: Chỉ Admin mới được tạo nhân viên. Nhân viên không được tạo nhân viên khác.

3.  **Advanced Analytics & Export:**
    * API Báo cáo doanh thu theo khoảng thời gian tùy chọn (Custom Range: From Date - To Date).
    * **API `GET /analytics/export`:** Xuất dữ liệu đơn hàng ra file **Excel (.xlsx)**.
    * Sử dụng thư viện `exceljs` để format cột, dòng, header cho file Excel chuyên nghiệp.

### 💻 Frontend (React)

1.  **Table Management (Full):**
    * Giao diện danh sách bàn, hiển thị trạng thái màu sắc (Trống/Có khách).
    * Nút **"Download QR PDF"** (Gọi API nhận file Blob và tải xuống).
    * Nút **"Làm mới QR"** (Cần confirm dialog trước khi chạy).

2.  **Staff Management:**
    * Trang quản lý nhân viên (Thêm/Sửa/Xóa).
    * Tính năng Reset mật khẩu cho nhân viên (khi nhân viên quên pass).

3.  **Reporting Dashboard:**
    * Thêm **DatePicker** (Chọn ngày bắt đầu - ngày kết thúc) cho biểu đồ doanh thu.
    * Nút **"Xuất Excel"** ở góc màn hình báo cáo.

---

## 📝 TỔNG HỢP API CẦN LÀM (Checklist Phase 4)

### Member 1 (System & Email)
* `POST /api/auth/forgot-password`
* `POST /api/auth/reset-password`
* `POST /api/auth/verify-email`
* `GET /api/system/settings` (Public/Cached)
* `PUT /api/system/settings` (Admin)
* `POST /api/admin/accounts` (Create Restaurant Admin)

### Member 2 (Profile & Social)
* `PUT /api/users/profile`
* `PUT /api/users/password`
* `GET /api/users/orders`
* `GET /api/auth/google`
* `GET /api/auth/google/callback`

### Member 3 (QR & Analytics)
* `POST /api/tables/:id/qr/regenerate`
* `GET /api/tables/:id/qr/pdf` (Download PDF)
* `GET /api/analytics/revenue?from=...&to=...`
* `GET /api/analytics/export` (Download Excel)
* `POST /api/admin/staff` (Create Waiter/Kitchen)