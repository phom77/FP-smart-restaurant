-- 1. Tạo bảng mã giảm giá
CREATE TABLE coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,       -- Mã (VD: TET2024)
  title VARCHAR(100) NOT NULL,            -- Tên voucher (VD: Giảm 20k đơn 100k)
  description TEXT,                       -- Mô tả
  discount_type VARCHAR(10) CHECK (discount_type IN ('percent', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,  -- Giá trị giảm (VD: 10 hoặc 20000)
  min_order_value DECIMAL(10,2) DEFAULT 0,-- Đơn tối thiểu
  max_discount_value DECIMAL(10,2),       -- Giảm tối đa (cho loại %)
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Ngày bắt đầu
  end_date TIMESTAMP WITH TIME ZONE,      -- Ngày kết thúc
  usage_limit INTEGER,                    -- Giới hạn số lượng dùng
  used_count INTEGER DEFAULT 0,           -- Đã dùng bao nhiêu
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Thêm cột vào đơn hàng
ALTER TABLE orders 
ADD COLUMN coupon_code VARCHAR(50),
ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;