# 🚀 PHASE 2: ORDER FLOW & REAL-TIME (VERTICAL SLICING)


---

## ⚙️ Yêu cầu kỹ thuật Backend (BẮT BUỘC)

- **Transaction**  
  Các thao tác ghi dữ liệu liên quan **nhiều bảng** bắt buộc dùng **Transaction** để đảm bảo *Rollback nếu có lỗi*.

- **Validation**  
  Validate dữ liệu đầu vào **chặt chẽ** (khuyến nghị: `joi`, `zod`).

- **Complex Queries**  
  Ưu tiên dùng **JOIN, GROUP BY, Sub-query** thay vì gọi nhiều query đơn lẻ gây sai lệch dữ liệu.

---

## 👤 THÀNH VIÊN 1 
### 🎯 Real-time Core & Kitchen Display System (KDS)

**Vai trò:** Xây dựng *"hệ thần kinh"* của hệ thống – Socket & luồng xử lý phức tạp nhất ở Bếp.

### 🛠 Backend (Node.js – Heavy Logic)

#### 1. Hạ tầng Socket.IO
- Setup Socket Server
- Cấu hình CORS
- Thiết kế **Room Logic**:
  - `joinRoom`
  - `leaveRoom`
  - Phân theo vai trò: `Admin`, `Kitchen`, `Table`
- Middleware xác thực Socket:
  - Chỉ user có **JWT token hợp lệ** mới được connect

#### 2. KDS API – Logic gom nhóm món
- **API:** `GET /api/kitchen/items`
- **Yêu cầu:**
  - Không lấy theo đơn hàng
  - Query **gom nhóm các món giống nhau**
  - Ví dụ:
    - 3 bàn gọi *Phở bò* → Bếp thấy: **3 × Phở bò**
- Sắp xếp ưu tiên:
  - Món **đợi lâu hơn hiển thị trước**

#### 3. Item State Machine
- Luồng trạng thái món:
  - `Pending → Cooking → Ready`
- Khi đổi trạng thái:
  - Emit socket event: **`item_updated`**
  - Màn hình **Waiter & Customer** tự động cập nhật

### 💻 Frontend (React)

#### 1. Socket Client
- Cấu hình `SocketContext`
- Dùng chung cho toàn bộ App

#### 2. Màn hình KDS (Bếp)
- Hiển thị danh sách món:
  - Dạng **Card** hoặc **Table**
- Logic Timer:
  - Đếm thời gian chờ
  - Đổi màu **đỏ** nếu quá hạn
- Nút chuyển trạng thái món

---

## 👤 THÀNH VIÊN 2
### 🎯 Customer Ordering (Transaction Heavy)

**Vai trò:** Xử lý giao dịch đặt hàng – khu vực **dễ sai dữ liệu nhất**.

### 🛠 Backend (Node.js – Transaction Heavy)

#### 1. Menu Advanced API
- **API:** `GET /api/menu-items/:id`
- Yêu cầu:
  - JOIN bảng `modifiers`, `modifier_groups`
  - Trả về JSON **Nested** để FE render option động

#### 2. Order Submission API
- **API:** `POST /api/orders`

**Validation:**
- Kiểm tra tồn kho
- Kiểm tra giá tiền (chống hack từ FE)
- Kiểm tra logic bắt buộc chọn topping

**Transaction:**
- Insert đồng thời:
  - `orders`
  - `order_items`
  - `order_item_modifiers`
- Lỗi 1 bước → **Rollback toàn bộ**

**Socket:**
- Sau khi transaction commit thành công → Emit event `new_order` tới room `Kitchen` và `Admin`.
- Emit event: **"Có đơn mới"**

**Cart Calculation:**
- Tính **tổng tiền, thuế phí** ở Backend
- Trả số liệu chính xác nhất cho FE

### 💻 Frontend (React)

#### 1. Màn hình Chi tiết món (Item Detail)
- Render dynamic option (Size, Topping)
- Tính tiền tạm tính ở Client

#### 2. Giỏ hàng & Thanh toán (Cart & Checkout)
- Quản lý State giỏ hàng
- Gửi JSON đơn hàng **đúng chuẩn API**

#### 3. Theo dõi đơn (Order Tracking)
- Lắng nghe Socket Event
- Cập nhật trạng thái:
  - `Received → Preparing → Ready`

---

## 👤 THÀNH VIÊN 3
### 🎯 Staff Workflow & Table Logic (Data Management)

**Vai trò:** Quản lý luồng vận hành & trạng thái bàn ăn.

### 🛠 Backend (Node.js – Logic & Statistics)

#### 1. Order Management API
- **API:** `GET /api/waiter/orders`
  - Filter theo trạng thái
  - Pagination

- **API:** `PUT /api/orders/:id/status`
  - Duyệt / Hủy đơn
  - Nếu hủy → hoàn lại tồn kho (nếu có)

#### 2. Table Logic Automation
- Khi **đơn đầu tiên của bàn → Processing**:
  - Tự động update Bàn → `Occupied`

- Khi **thanh toán xong**:
  - Update Bàn → `Dirty` hoặc `Available`

#### 3. Revenue Statistics (Nâng cao)
- API thống kê doanh thu:
  - Theo **ngày / tuần**
- Dùng SQL Aggregate:
  - `SUM`, `COUNT`

### 💻 Frontend (React)

#### 1. Waiter Dashboard
- Danh sách đơn `Pending`
- Nút **Chấp nhận / Từ chối**

#### 2. Sơ đồ bàn (Table Map)
- Vẽ lưới bàn ăn
- Màu sắc theo trạng thái:
  - Trống
  - Có khách
  - Chờ thanh toán

#### 3. Chi tiết đơn (Staff View)
- Xem các món đã gọi
- Tổng tiền
- In hóa đơn tạm

---

## 📝 TÓM TẮT GIAO VIỆC (Copy gửi nhóm)

| Thành viên | Backend (Node.js) | Frontend (React) |
|-----------|------------------|------------------|
| **Mem 1** | Socket.IO, KDS Logic (Gom nhóm), Item State Machine | Socket Context, Màn hình KDS |
| **Mem 2** | Transaction tạo đơn, Validate giá & tồn kho, Menu Detail API | Chọn món, Giỏ hàng, Tracking |
| **Mem 3** | Trạng thái Đơn & Bàn (Automation), API Doanh thu | Waiter Dashboard, Table Map, In hóa đơn |

---

## ⚠️ LƯU Ý SỐNG CÒN – PHASE 2

- **Database**: Ai sửa cấu trúc DB **phải báo ngay** cho cả nhóm
- **API Response**: Thống nhất format
  ```json
  { "success": true, "data": ... }
  ```
- **Git Workflow**:
  - Mỗi người 1 nhánh:
    - `feature/kds`
    - `feature/order-creation`
    - `feature/staff-flow`
  - Merge vào `dev` **mỗi ngày** để tránh conflict lớn

