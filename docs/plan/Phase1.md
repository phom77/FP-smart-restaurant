# 📅 PROJECT PLAN - PHASE 1: FOUNDATION & MENU DIGITIZATION

**Mục tiêu:** Hệ thống có thể **Đăng ký/Đăng nhập**, **Admin tạo được Menu/Bàn**, và **Khách hàng quét mã QR xem được Menu**.

---

## 👥 PHÂN CHIA VAI TRÒ (GIAI ĐOẠN 1)

| Thành viên   | Role dự án       | Trọng tâm Giai đoạn 1                     | 
| ------------ | ---------------- | ----------------------------------------- | 
| Khánh | System Architect | Authentication, Security, Table & QR Core |
| Thành viên 2 | Customer Exp     | Giao diện hiển thị Menu, UX/UI cho khách  |
| Thành viên 3 | Operations       | Quản lý Món ăn (CRUD), Upload ảnh         | 

---

## 📝 CHI TIẾT CÔNG VIỆC

### 1.  Khánh: Core System, Auth & Table Logic



#### Backend Tasks (Node.js)

**Authentication API:**

* API Register: Validate input, hash password (bcryptjs), tạo user trong DB.
* API Login: Kiểm tra pass, sinh Access Token (jsonwebtoken).
* API Get Profile: Lấy thông tin user hiện tại từ token.

**Middleware (Security):**

* Hoàn thiện authMiddleware: Verify JWT token.
* Hoàn thiện roleMiddleware: Chặn API dựa trên role (admin, customer, v.v.).

**Table Management Logic:**

* API tạo bàn ăn (Table 1, Table 2...).
* Logic QR Code: Viết hàm sinh chuỗi Token duy nhất cho từng bàn -> Dùng thư viện (qrcode) để chuyển thành ảnh base64 hoặc link ảnh.

#### Frontend Tasks (React)

* Auth Pages: Giao diện Login / Register / Forgot Password.
* Auth Integration: Xử lý lưu Token vào localStorage và chuyển hướng trang sau khi login thành công.

---

### 2.  MEMBER 2: Guest Experience (Menu Viewer)


#### Frontend Tasks (React)

* Customer Layout: Xây dựng Header, Footer, Navigation cho giao diện Mobile.

**Home Page (Menu):**

* Gọi API lấy danh sách món ăn.
* Hiển thị danh sách dạng Grid/List (Ảnh, Tên, Giá).

**Menu Filter & Search:**

* Tạo thanh tìm kiếm món ăn (Filter trên Frontend).
* Tạo các Tabs danh mục (Khai vị, Món chính...) để lọc món.

**Item Detail:**

* Làm Popup (Modal) hoặc trang chi tiết khi bấm vào món ăn (hiển thị mô tả, giá).

#### Backend Tasks (Node.js)

* Public API: Viết API `GET /api/menu` và `GET /api/categories` (Public, không cần token) để Frontend gọi dữ liệu.

---

### 3.  MEMBER 3: Restaurant Operations (Admin Dashboard)


#### Backend Tasks (Node.js)

* Category Management: API CRUD (Tạo/Sửa/Xóa) danh mục món ăn.
* Menu Management: API CRUD món ăn.

**File Upload:**

* Cấu hình multer để upload ảnh món ăn.
* (Nâng cao) Upload ảnh lên Cloud (Cloudinary hoặc Supabase Storage) và lưu link vào DB.

#### Frontend Tasks (React)

* Admin Layout: Xây dựng Sidebar và Header cho trang quản trị.

**Menu Management UI:**

* Bảng danh sách món ăn (Table).

* Form "Thêm món mới": Có ô nhập tên, giá, và nút upload ảnh.

* Category Management UI: Form quản lý danh mục.

---

## 🔗 QUY TRÌNH PHỐI HỢP (Workflow)

**Khánh:**

* Tạo nhánh `feature/auth-core`.
* Code xong phần Auth & Middleware -> Push -> Merge vào `dev`.
* **Lý do:** Hai bạn kia cần chức năng Login và Middleware của bạn để làm phần Admin (cần quyền Admin mới thêm sửa xóa được).

**Member 3:**

* Tạo nhánh `feature/admin-menu`.
* Code API thêm món và giao diện Admin.
* **Lý do:** Cần có món ăn trong Database thì Member 2 mới có cái để hiển thị.

**Member 2:**

* Tạo nhánh `feature/customer-ui`.
* Có thể dùng dữ liệu giả (Mock data) làm giao diện trước. Khi Member 3 làm xong API thêm món thì đổi sang gọi API thật.

---

## 🏆 KẾT QUẢ CẦN ĐẠT ĐƯỢC SAU GIAI ĐOẠN 1

* Truy cập `/login` -> Đăng nhập được bằng tài khoản Admin/Customer.
* Truy cập `/admin` -> Thêm được một món "Cơm tấm", upload ảnh thành công.
* Truy cập `/` (Trang chủ) -> Thấy món "Cơm tấm" vừa thêm hiện ra đẹp mắt.
* Admin bấm nút -> Sinh ra được mã QR cho "Bàn số 1".
