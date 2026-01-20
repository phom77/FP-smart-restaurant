-- 1. Thêm các cột mới cho Table Management Phase 4
ALTER TABLE tables 
ADD COLUMN IF NOT EXISTS location VARCHAR(100),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS token_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Chuyển đổi kiểu dữ liệu của qr_code_token từ UUID sang TEXT để lưu JWT
ALTER TABLE tables 
ALTER COLUMN qr_code_token TYPE TEXT USING qr_code_token::text;

-- 3. Cập nhật ràng buộc capacity (1-20 người)
ALTER TABLE tables 
DROP CONSTRAINT IF EXISTS tables_capacity_check;

ALTER TABLE tables 
ADD CONSTRAINT tables_capacity_check CHECK (capacity > 0 AND capacity <= 20);
