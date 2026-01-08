# 📡 SMART RESTAURANT – API ENDPOINTS SPECIFICATION

**Base URL:** `http://localhost:5000/api`

## Quy ước chung
- `:id` là tham số động (UUID).
- **Auth**: Yêu cầu Header `Authorization: Bearer <token>` với các endpoint cần xác thực.

---

## 1. 🔐 Authentication (Xác thực)
Dành cho việc đăng ký, đăng nhập và lấy thông tin User.

| Method | Endpoint | Quyền (Role) | Mô tả | Body Request |
|------|---------|--------------|------|--------------|
| POST | `/auth/register` | Public | Đăng ký tài khoản Khách hàng | `{ email, password, full_name, phone }` |
| POST | `/auth/login` | Public | Đăng nhập (Admin, Staff, Customer) | `{ email, password }` |
| POST | `/auth/refresh-token` | Logged In | Làm mới Token | `{ refreshToken }` |
| GET | `/auth/me` | Logged In | Lấy thông tin User hiện tại | None |
| POST | `/auth/logout` | Logged In | Đăng xuất | None |
| POST | `/auth/verify-email` | Public | Xác thực Email | `{ token }` |

---

## 2. 👤 User & Staff Management (Quản lý nhân sự)
Admin quản lý tài khoản nhân viên (Waiter, Kitchen).

| Method | Endpoint | Quyền | Mô tả | Body |
|------|---------|-------|------|------|
| GET | `/admin/users` | Admin | Lấy danh sách nhân viên | `?role=waiter` |
| GET | `/admin/users/:id` | Admin | Xem chi tiết nhân viên | None |
| POST | `/admin/users` | Admin | Tạo tài khoản nhân viên | `{ email, password, full_name, role }` |
| PUT | `/admin/users/:id` | Admin | Cập nhật thông tin | `{ full_name, role, is_active }` |
| DELETE | `/admin/users/:id` | Admin | Xóa/Vô hiệu hóa nhân viên | None |

---

## 3. 🪑 Table & QR Management (Quản lý Bàn & QR)
Quản lý sơ đồ bàn và mã QR.

| Method | Endpoint | Quyền | Mô tả | Body |
|------|---------|-------|------|------|
| GET | `/admin/tables` | Public / Staff | Lấy danh sách bàn | `?status=available` |
| GET | `/admin/tables/:id` | Public / Staff | Chi tiết bàn | None |
| POST | `/admin/tables` | Admin | Tạo bàn mới | `{ table_number, capacity }` |
| PUT | `/admin/tables/:id` | Admin | Sửa thông tin bàn | `{ table_number, capacity }` |
| DELETE | `/admin/tables/:id` | Admin | Xóa bàn | None |
| POST | `/admin/tables/:id/qr` | Admin | Tạo lại mã QR | None |
| GET | `/admin/tables/qr-all` | Admin | Tải toàn bộ QR (Zip/PDF) | None |
| PATCH | `/tables/:id/status` | Waiter / Admin | Cập nhật trạng thái bàn | `{ status: 'occupied' }` |

---

## 4. 🍔 Menu Management (Quản lý Thực đơn)
CRUD Món ăn, Danh mục và Topping.

| Method | Endpoint | Quyền | Mô tả | Body |
|------|---------|-------|------|------|
| GET | `/menu/categories` | Public | Danh sách danh mục | None |
| GET | `/menu/items` | Public | Danh sách món ăn | `?category_id=&search=` |
| GET | `/menu/items/:id` | Public | Chi tiết món (kèm modifiers) | None |
| POST | `/admin/categories` | Admin | Tạo danh mục | `{ name, image_url, sort_order }` |
| POST | `/admin/menu-items` | Admin | Tạo món ăn | `{ name, price, category_id, description, image_url }` |
| PUT | `/admin/menu-items/:id` | Admin | Sửa món ăn | `{ name, price, is_available }` |
| DELETE | `/admin/menu-items/:id` | Admin | Xóa món | None |
| POST | `/admin/modifiers` | Admin | Tạo nhóm topping | `{ name, options: [{ name, price }] }` |

---

## 5. 🛒 Order System (Hệ thống Gọi món)
Quy trình: **Khách → Waiter duyệt → Kitchen nấu**.

| Method | Endpoint | Quyền | Mô tả | Body |
|------|---------|-------|------|------|
| POST | `/orders` | Public | Tạo đơn mới | `{ table_id, items }` |
| POST | `/orders/:id/items` | Public | Gọi thêm món | `{ items }` |
| GET | `/orders/:id` | Public | Xem trạng thái đơn | None |
| POST | `/orders/:id/checkout` | Public | Yêu cầu thanh toán | `{ payment_method }` |
| GET | `/waiter/orders` | Waiter | Danh sách đơn cần duyệt | `?status=pending` |
| PATCH | `/waiter/orders/:id` | Waiter | Duyệt/Hủy đơn | `{ status }` |
| PATCH | `/waiter/orders/:id/pay` | Waiter | Xác nhận thanh toán | `{ status: 'completed' }` |
| GET | `/users/order-history` | Logged In | Lịch sử đơn hàng của khách | None |

---

## 6. 🍳 Kitchen Display System (KDS)
Bếp chỉ quan tâm món ăn.

| Method | Endpoint | Quyền | Mô tả | Body |
|------|---------|-------|------|------|
| GET | `/kitchen/items` | Kitchen | Danh sách món cần nấu | `?status=pending` |
| PATCH | `/kitchen/items/:id` | Kitchen | Cập nhật trạng thái món | `{ status: 'preparing' | 'ready' }` |

---

## 7. 📂 Uploads (Tải ảnh)

| Method | Endpoint | Quyền | Mô tả | Body |
|------|---------|-------|------|------|
| POST | `/upload/image` | Admin | Upload ảnh món ăn | `FormData { file }` |

---

## 📦 JSON mẫu – Tạo đơn hàng
```json
{
  "table_id": "uuid...",
  "items": [
    {
      "menu_item_id": "uuid...",
      "quantity": 2,
      "notes": "Ít cay",
      "modifiers": [
        { "id": "uuid-size-L", "price": 5000 },
        { "id": "uuid-topping-tran-chau", "price": 3000 }
      ]
    }
  ]
}
```

---

## 🔄 Status Flow

### Order Status
- `pending` → `processing` → `completed`


### Item Status
- `pending` → `preparing` → `ready` → `served`

---

## 8. 🚀 Advanced Features (Phase 3)
Các tính năng nâng cao: Thanh toán, Đánh giá, Tìm kiếm, Thống kê.

### 8.1. 💳 Payment Integration
| Method | Endpoint | Quyền | Mô tả | Body |
|------|---------|-------|------|------|
| POST | `/payment/create-intent` | Public | Tạo phiên thanh toán (Stripe/ZaloPay) | `{ order_id, method }` |
| POST | `/payment/webhook` | Public | Webhook nhận kết quả từ Gateway | JSON from Gateway |

### 8.2. ⭐ Reviews
| Method | Endpoint | Quyền | Mô tả | Body |
|------|---------|-------|------|------|
| POST | `/reviews` | Logged In | Đánh giá món ăn (đã mua) | `{ item_id, rating, comment }` |
| GET | `/menu-items/:id/reviews` | Public | Lấy danh sách đánh giá | None |

### 8.3. 🔍 Search & Recommendations
| Method | Endpoint | Quyền | Mô tả | Body |
|------|---------|-------|------|------|
| GET | `/search` | Public | Tìm kiếm nâng cao (Fuzzy search) | `?q=burger` |
| GET | `/menu-items/:id/recommendations` | Public | Gợi ý món liên quan | None |

### 8.4. 📊 Analytics (Admin)
| Method | Endpoint | Quyền | Mô tả | Body |
|------|---------|-------|------|------|
| GET | `/analytics/revenue` | Admin | Báo cáo doanh thu | `?from=...&to=...` |
| GET | `/analytics/top-products` | Admin | Top món bán chạy | None |
| GET | `/analytics/peak-hours` | Admin | Thống kê giờ cao điểm | None |
| GET | `/analytics/export` | Admin | Xuất báo cáo Excel | None |



