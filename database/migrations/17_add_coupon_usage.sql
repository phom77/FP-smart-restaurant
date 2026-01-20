-- 1. Thêm cột cấu hình đối tượng vào bảng coupons
ALTER TABLE coupons 
ADD COLUMN target_type VARCHAR(20) DEFAULT 'all' CHECK (target_type IN ('all', 'new_user')),
ADD COLUMN limit_per_user INTEGER DEFAULT 1; 

-- 2. Tạo bảng lưu lịch sử sử dụng (Để biết ai đã dùng rồi)
CREATE TABLE coupon_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);