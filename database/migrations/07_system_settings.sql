-- Migration: 07_system_settings.sql
-- Purpose: Store global system configurations (Phase 4)

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(50) PRIMARY KEY, -- VD: 'restaurant_name', 'wifi_pass', 'vat_tax'
    value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed dữ liệu mặc định ban đầu
INSERT INTO system_settings (key, value, description) VALUES
('restaurant_name', 'Smart Restaurant', 'Tên hiển thị của nhà hàng'),
('currency', 'VND', 'Đơn vị tiền tệ'),
('vat_rate', '8', 'Thuế VAT (%)'),
('wifi_password', '12345678', 'Mật khẩu Wifi cho khách'),
('open_time', '08:00', 'Giờ mở cửa'),
('close_time', '22:00', 'Giờ đóng cửa')
ON CONFLICT (key) DO NOTHING;