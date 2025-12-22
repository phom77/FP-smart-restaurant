-- 1. Enable UUID extension (Hỗ trợ ID dạng chuỗi ngẫu nhiên bảo mật)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Define ENUMs (Định nghĩa các tập giá trị cố định)
CREATE TYPE user_role AS ENUM ('admin', 'waiter', 'kitchen', 'customer');
CREATE TYPE table_status AS ENUM ('available', 'occupied', 'reserved');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled'); 
-- pending: Khách vừa vào; processing: Đang ăn; completed: Đã thanh toán; cancelled: Hủy
CREATE TYPE item_status AS ENUM ('pending', 'preparing', 'ready', 'served', 'rejected');

-- 3. USERS TABLE (Liên kết với Supabase Auth nếu cần, ở đây tạo bảng độc lập cho dễ hiểu logic)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Sẽ lưu hash password
    full_name VARCHAR(100),
    role user_role DEFAULT 'customer',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RESTAURANT TABLES (Bàn ăn)
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_number VARCHAR(10) UNIQUE NOT NULL, -- Ví dụ: "B01", "A02"
    capacity INT DEFAULT 4,
    status table_status DEFAULT 'available',
    qr_code_token UUID DEFAULT uuid_generate_v4(), -- Token để tạo QR Code bảo mật
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CATEGORIES (Danh mục món)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    image_url TEXT,
    sort_order INT DEFAULT 0, -- Để sắp xếp hiển thị
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MENU ITEMS (Món ăn)
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE, -- Hết món thì set false
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MODIFIERS GROUPS (Nhóm Topping: Size, Mức đường...)
CREATE TABLE modifier_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- VD: "Size", "Toppings"
    min_selection INT DEFAULT 0, -- 0 là không bắt buộc
    max_selection INT DEFAULT 1, -- 1 là chọn 1 cái (Radio), >1 là Checkbox
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LINK MENU ITEMS <-> MODIFIER GROUPS (Quan hệ nhiều-nhiều)
-- Một món có thể có nhiều nhóm topping (Trà sữa có Size và Topping)
CREATE TABLE item_modifier_groups (
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    modifier_group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (menu_item_id, modifier_group_id)
);

-- 9. MODIFIERS (Chi tiết Topping: Size L, Trân châu...)
CREATE TABLE modifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price_adjustment DECIMAL(10, 2) DEFAULT 0, -- Giá cộng thêm (+5000)
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ORDERS (Đơn hàng tổng/Phiên ăn)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Null nếu khách vãng lai
    status order_status DEFAULT 'pending',
    total_amount DECIMAL(10, 2) DEFAULT 0,
    payment_method VARCHAR(50), -- 'cash', 'momo', 'zalopay'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ORDER ITEMS (Chi tiết từng món trong đơn)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id),
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL, -- Lưu giá tại thời điểm đặt (tránh giá gốc thay đổi)
    total_price DECIMAL(10, 2) NOT NULL, -- (unit_price * quantity) + modifiers
    notes TEXT, -- Ghi chú: "Ít cay"
    status item_status DEFAULT 'pending', -- Trạng thái từng món (Bếp cần cái này)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. ORDER ITEM MODIFIERS (Lưu topping khách đã chọn cho món đó)
CREATE TABLE order_item_modifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    modifier_id UUID REFERENCES modifiers(id),
    modifier_name VARCHAR(100), -- Lưu tên tại thời điểm đặt
    price DECIMAL(10, 2) -- Lưu giá tại thời điểm đặt
);