# 🗄️ CÁC MỤC CÒN THIẾU TRONG DATABASE SCHEMA
**Nguồn:** Phân tích từ `docs/PROJECT_DESCRIPTION.md` so với `database/migrations/01_init_schema.sql`

Các bảng và cột sau đây là cần thiết để hỗ trợ đầy đủ mô tả dự án nhưng hiện đang thiếu trong schema ban đầu.

## 1. Các Bảng Bị Thiếu (Missing Tables)

### `reviews`
*   **Mục đích:** Để lưu trữ đánh giá của khách hàng cho các món ăn.
*   **Các Cột Yêu Cầu (Required Columns):**
    *   `id` (UUID, PK)
    *   `user_id` (UUID, FK -> users)
    *   `menu_item_id` (UUID, FK -> menu_items)
    *   `rating` (INT, 1-5)
    *   `comment` (TEXT)
    *   `created_at` (TIMESTAMP)

### `payments` (hoặc `transactions`)
*   **Mục đích:** Để ghi lại chi tiết giao dịch thanh toán từ các cổng (ZaloPay, Stripe, MoMo).
*   **Các Cột Yêu Cầu (Required Columns):**
    *   `id` (UUID, PK)
    *   `order_id` (UUID, FK -> orders)
    *   `transaction_code` (VARCHAR) - ID trả về từ cổng thanh toán
    *   `amount` (DECIMAL)
    *   `currency` (VARCHAR)
    *   `gateway` (VARCHAR) - ví dụ: 'stripe', 'zalopay'
    *   `status` (VARCHAR) - 'pending', 'success', 'failed'
    *   `response_log` (JSON/TEXT) - Phản hồi đầy đủ để debug
    *   `created_at` (TIMESTAMP)

### `system_settings`
*   **Mục đích:** Để lưu trữ thông tin cấu hình nhà hàng.
*   **Các Cột Yêu Cầu (Required Columns):**
    *   `key` (VARCHAR, PK)
    *   `value` (TEXT/JSON)
    *   `description` (TEXT)
    *   **Ví dụ:** `restaurant_name`, `wifi_password`, `opening_hours`.

## 2. Các Cột Bị Thiếu Trong Bảng Hiện Có (Missing Columns)

### Bảng: `users`
| Cột (Column) | Kiểu (Type) | Mục đích |
| :--- | :--- | :--- |
| `phone` | VARCHAR | Cần thiết cho việc đăng ký và liên hệ. |
| `email_verified_at` | TIMESTAMP | Để theo dõi xem người dùng đã xác thực email chưa (Quy trình Đăng ký). |
| `preferences` | JSONB | Để lưu "sở thích đã lưu" (ví dụ: thẻ yêu thích, dị ứng). |

### Bảng: `menu_items` (Tùy chọn cho Phase 3)
| Cột (Column) | Kiểu (Type) | Mục đích |
| :--- | :--- | :--- |
| `name_en` | VARCHAR | Để hỗ trợ chuyển đổi Tiếng Anh/Tiếng Việt (Đa ngôn ngữ). |
| `description_en` | TEXT | Mô tả song ngữ. |

### Bảng: `orders`
| Cột (Column) | Kiểu (Type) | Mục đích |
| :--- | :--- | :--- |
| `table_session_id` | UUID | (Tùy chọn) Để nhóm nhiều đơn hàng thành một phiên "ngồi" nếu cần, mặc dù `table_id` + status có thể là đủ. |

---

## 3. Hành Động Đề Xuất
Tạo một file migration mới `database/migrations/02_missing_features.sql` để áp dụng các thay đổi này.
