-- 1. Tạo bảng REVIEWS (Đánh giá)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tạo bảng PAYMENTS (Thanh toán)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    transaction_code VARCHAR(100),
    amount DECIMAL(10, 2) NOT NULL,
    gateway VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Cập nhật bảng ORDERS (Thêm session)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_session_id UUID;

-- 4. Cập nhật bảng TABLES (Đảm bảo có cột token)
-- (Câu này chỉ chạy nếu bảng tables chưa có cột qr_code_token)
ALTER TABLE tables ADD COLUMN IF NOT EXISTS qr_code_token UUID DEFAULT uuid_generate_v4();

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);