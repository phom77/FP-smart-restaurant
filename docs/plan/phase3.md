
# 🚀 PHASE 3: ADVANCED FEATURES, PAYMENT & DEVOPS (HEAVY WORKLOAD)

**Mục tiêu:** Hoàn thiện các tính năng nâng cao (Payment, Search, Analytics) và chuẩn hóa quy trình vận hành (CI/CD, Caching).

---

## 👤 THÀNH VIÊN 1 (LEADER): Payment Ecosystem & CI/CD
*Trách nhiệm: Xử lý giao dịch tài chính (quan trọng nhất) và quy trình Deploy tự động.*

### 🛠 Backend (Node.js - Security & DevOps)
1.  **Payment Integration (Stripe/ZaloPay):**
    *   **API `POST /orders/:id/payment-intent`:** Gọi sang Stripe tạo phiên thanh toán.
    *   **API `POST /webhook` (Cực quan trọng):**
        *   Nhận callback từ Stripe/ZaloPay khi khách trả tiền thành công.
        *   **Security:** Phải verify chữ ký (Signature) để đảm bảo request đến từ Stripe thật chứ không phải Hacker giả mạo.
        *   **Logic:** Update `status` đơn hàng thành `paid`. Nếu đơn hàng đang `cancelled` mà tiền vẫn về thì phải log lại để hoàn tiền.
2.  **CI/CD Pipeline (Github Actions):**
    *   Tạo file `.github/workflows/deploy.yml`.
    *   Cấu hình: Mỗi khi push code vào nhánh `main` -> Tự động chạy test -> Tự động build Docker -> Tự động deploy lên Render/Vercel.
    *   *Đây là kiến thức DevOps rất giá trị cho Leader.*

### 💻 Frontend (React)
1.  **Payment UI:**
    *   Tích hợp Stripe Elements (Form nhập thẻ đẹp, bảo mật).
    *   Xử lý các trạng thái: Đang xử lý, Thành công, Thẻ bị từ chối.
2.  **Receipt Page:** Trang hóa đơn điện tử sau khi thanh toán thành công.

---

## 👤 THÀNH VIÊN 2: Customer Intelligence & Interaction
*Trách nhiệm: Tăng tương tác người dùng và thuật toán tìm kiếm.*

### 🛠 Backend (Node.js - Logic & Algorithm)
## 1. Database Migration (VIỆC MỚI – BẮT BUỘC)

**Người thực hiện:** Thành viên 2
**Mô tả:** Tạo migration SQL mới để hỗ trợ chức năng Review.

### 📄 Thông tin file
- **Tên file migration:** `02_add_reviews.sql`

### 📋 Yêu cầu cấu trúc bảng `reviews`
- `id`: UUID – Khóa chính
- `user_id`: UUID – Liên kết user đánh giá
- `menu_item_id`: UUID – Món ăn được đánh giá
- `rating`: Số nguyên (1–5)
- `comment`: Nội dung đánh giá
- `created_at`: Thời điểm tạo

### 📌 SQL SCRIPT (Chạy trên Supabase)

```sql
-- Migration: 02_add_reviews.sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index để query nhanh theo món ăn
CREATE INDEX idx_reviews_item ON reviews(menu_item_id);
```
2.  **Review Logic (Chặt chẽ):**
    *   **API `POST /reviews`:**
        *   **Validation:** Phải query bảng `orders` và `order_items` để kiểm tra xem User này **đã thực sự mua món này chưa** và đơn hàng đã `completed` chưa mới cho đánh giá. (Chống spam review).
    *   **Trigger/Calculation:** Khi có review mới -> Tính lại điểm trung bình (`avg_rating`) và update vào bảng `menu_items` ngay lập tức (để lúc query món ăn không phải tính lại).
3.  **Advanced Search (Fuzzy Search):**
    *   Cài extension `pg_trgm` cho Postgres.
    *   Viết Query tìm kiếm chấp nhận sai chính tả (VD: Khách gõ "buger" vẫn ra "Burger").
4.  **Recommendation System (Gợi ý món):**
    *   Viết API `GET /menu-items/:id/related`:
        *   Logic 1: Lấy món cùng Category.
        *   Logic 2 (Nâng cao): Query tìm "Các món thường được order cùng nhau" (Dựa vào lịch sử `order_items`).

### 💻 Frontend (React)
1.  **Smart Search Bar:** Gõ đến đâu gọi API tìm đến đó (Debounce).
2.  **Review Component:** Form đánh giá sao, hiển thị list comment bên dưới món ăn.
3.  **Related Items:** Hiển thị carousel món gợi ý.

---

## 👤 THÀNH VIÊN 3: Data Analytics & Performance
*Trách nhiệm: Tối ưu tốc độ hệ thống và Báo cáo số liệu (SQL nặng).*

### 🛠 Backend (Node.js - SQL & Infrastructure)
1.  **Redis Caching (Tăng tốc độ):**
    *   Cài đặt Redis Client.
    *   **Middleware Cache:** Áp dụng cho API `GET /menu-items`.
        *   Logic: Check Redis -> Có thì trả về (Hit) -> Không có thì Query DB -> Lưu Redis (Miss).
    *   **Cache Invalidation:** Viết logic xóa cache khi Admin thêm/sửa/xóa món ăn.
2.  **Analytics API (SQL Phức tạp):**
    *   **Revenue Report:** Doanh thu theo ngày/tuần/tháng.
    *   **Product Performance:** Top 10 món bán chạy nhất, Top 10 món doanh thu cao nhất.
    *   **Peak Hours:** Thống kê số lượng đơn hàng theo khung giờ (0h-24h) để biết giờ cao điểm.
3.  **Export Service:**
    *   Dùng thư viện `exceljs` để xuất các báo cáo trên ra file Excel từ Backend.

### 💻 Frontend (React)
1.  **Admin Dashboard (Nâng cao):**
    *   Vẽ biểu đồ đường (Revenue), biểu đồ cột (Top products), biểu đồ nhiệt (Peak hours).
2.  **Multilingual (i18n):**
    *   Cài `i18next`. Tạo file json tiếng Việt/Anh.
    *   Gắn hàm `t('key')` vào toàn bộ giao diện. (Làm cái này để lấy 0.25 điểm, không khó nhưng tốn thời gian, phù hợp làm xen kẽ).

---

## 📝 DANH SÁCH API CẦN VIẾT (Checklist)

### Leader (Payment)
*   `POST /api/payment/create-intent` (Tạo giao dịch)
*   `POST /api/payment/webhook` (Nhận kết quả từ Stripe - Public URL)

### Member 2 (Review & Search)
*   `POST /api/reviews` (Đánh giá - Có check điều kiện mua hàng)
*   `GET /api/menu-items/:id/reviews` (Lấy đánh giá)
*   `GET /api/search?q=...` (Tìm kiếm mờ)
*   `GET /api/menu-items/:id/recommendations` (Gợi ý món)

### Member 3 (Analytics & Cache)
*   `GET /api/analytics/revenue?from=...&to=...`
*   `GET /api/analytics/top-products`
*   `GET /api/analytics/peak-hours`
*   `GET /api/analytics/export` (Download Excel)

---

### 💡 Lời khuyên triển khai:
1.  **Redis:** Nếu máy thành viên nào yếu không chạy được Redis Docker, Member 3 phải viết code có chế độ "Fallback" (Nếu không kết nối được Redis thì cứ gọi DB bình thường) để không làm chặn công việc của người khác.
2.  **Webhook:** Leader cần dùng **Ngrok** để test webhook dưới máy local.
3.  **Data giả:** Để test Analytics, Member 3 cần viết một script (seeder) để tạo ra khoảng 100 đơn hàng giả trong DB với ngày tháng khác nhau thì vẽ biểu đồ mới đẹp được.
