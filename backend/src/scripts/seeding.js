const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
// Dùng SERVICE_KEY để có quyền xóa bất chấp RLS (Row Level Security)
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Hàm tiện ích random
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function fixData() {
    console.log('🗑️  BẮT ĐẦU DỌN DẸP DỮ LIỆU RÁC...');

    // ---------------------------------------------------------
    // 1. XÓA SẠCH DỮ LIỆU (Clean Slate)
    // Phải xóa theo thứ tự: Bảng con xóa trước -> Bảng cha xóa sau
    // ---------------------------------------------------------

    // Xóa các bảng phụ thuộc cấp 2 (nếu có bảng modifier)
    await supabase.from('order_item_modifiers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Xóa bảng thanh toán và đánh giá (vì nó link tới user/order)
    await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Xóa chi tiết đơn hàng
    const { error: errItems } = await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errItems) console.error('Lỗi xóa items:', errItems.message);

    // Xóa đơn hàng tổng
    const { error: errOrders } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errOrders) console.error('Lỗi xóa orders:', errOrders.message);

    // Reset trạng thái tất cả bàn về 'available'
    await supabase.from('tables').update({ status: 'available' }).neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('✨ Đã xóa sạch dữ liệu cũ. Database giờ như mới.');

    // ---------------------------------------------------------
    // 2. CHUẨN BỊ DỮ LIỆU GỐC
    // ---------------------------------------------------------
    const { data: menuItems } = await supabase.from('menu_items').select('*');
    const { data: tables } = await supabase.from('tables').select('*');

    if (!menuItems?.length || !tables?.length) {
        console.error('❌ Lỗi: Cần có dữ liệu Menu và Bàn trước khi chạy script này.');
        return;
    }

    // ---------------------------------------------------------
    // 3. TẠO ĐƠN HÀNG ĐANG ĂN (ACTIVE) - SỬA LỖI ENUM TẠI ĐÂY
    // ---------------------------------------------------------
    console.log('🔄 Đang tạo dữ liệu Active Order mới...');

    // Lấy 4 bàn ngẫu nhiên
    const shuffledTables = [...tables].sort(() => 0.5 - Math.random());
    const activeTables = shuffledTables.slice(0, 4);

    for (const table of activeTables) {
        // Cập nhật trạng thái bàn -> occupied
        await supabase.from('tables').update({ status: 'occupied' }).eq('id', table.id);

        const now = new Date();
        now.setMinutes(now.getMinutes() - getRandomInt(5, 50)); // Khách vào từ 5-50p trước

        // TẠO ORDER (Sửa 'serving' thành 'processing')
        const { data: newOrder, error: insertError } = await supabase
            .from('orders')
            .insert({
                table_id: table.id,
                status: 'processing', // <--- SỬA LỖI: Dùng đúng ENUM của DB
                total_amount: 0,
                created_at: now.toISOString(),
            })
            .select()
            .single();

        if (insertError) {
            console.error(`❌ Lỗi tạo Order bàn ${table.table_number}:`, insertError.message);
            continue;
        }

        if (newOrder) await createRandomItems(newOrder.id, menuItems, now, 'preparing');
    }

    // ---------------------------------------------------------
    // 4. TẠO LỊCH SỬ ĐƠN HÀNG (COMPLETED)
    // ---------------------------------------------------------
    console.log('📜 Đang tạo dữ liệu Lịch sử (Giả lập giờ cao điểm)...');
    const historyCount = 30; // Tăng lên chút cho biểu đồ đẹp

    for (let i = 0; i < historyCount; i++) {
        const randomTable = getRandomItem(tables);

        const date = new Date();
        // 1. Random ngày (trong 7 ngày qua)
        date.setDate(date.getDate() - getRandomInt(0, 7));

        // 2. LOGIC RANDOM GIỜ (Quan trọng để fix lỗi trùng giờ)
        const rand = Math.random();
        if (rand < 0.4) {
            // 40% khách ăn trưa (11h - 13h)
            date.setHours(getRandomInt(11, 13));
        } else if (rand < 0.8) {
            // 40% khách ăn tối (18h - 20h)
            date.setHours(getRandomInt(18, 20));
        } else {
            // 20% khách ăn giờ linh tinh (8h sáng - 21h tối)
            date.setHours(getRandomInt(8, 21));
        }

        // Random phút cho tự nhiên
        date.setMinutes(getRandomInt(0, 59));
        date.setSeconds(getRandomInt(0, 59));

        // ... (Đoạn dưới giữ nguyên) ...
        const { data: newOrder } = await supabase
            .from('orders')
            .insert({
                table_id: randomTable.id,
                status: 'completed',
                total_amount: 0,
                created_at: date.toISOString(), // Giờ đã được random
            })
            .select()
            .single();

        if (newOrder) {
            // Gọi hàm tạo món (Status là 'served' vì đơn đã xong)
            await createRandomItems(newOrder.id, menuItems, date, 'served');

            // TẠO THANH TOÁN LUÔN (Để biểu đồ doanh thu hiện lên)
            // Giả lập thanh toán sau khi gọi món 30-45 phút
            const paymentTime = new Date(date.getTime() + getRandomInt(30, 45) * 60000);

            await supabase.from('payments').insert({
                order_id: newOrder.id,
                amount: 0, // Sẽ update trigger hoặc tính sau, tạm để 0 script ko lỗi
                transaction_code: `TRANS_${paymentTime.getTime()}`,
                gateway: getRandomItem(['Momo', 'ZaloPay', 'Cash']),
                status: 'completed',
                created_at: paymentTime.toISOString()
            });
        }
    }
}

// Hàm phụ trợ tạo món ăn
async function createRandomItems(orderId, menuItems, createdAt, itemStatus) {
    const numItems = getRandomInt(2, 5);
    let totalAmount = 0;
    const itemsToInsert = [];

    for (let j = 0; j < numItems; j++) {
        const item = getRandomItem(menuItems);
        const quantity = getRandomInt(1, 3);
        const price = item.price * quantity;

        itemsToInsert.push({
            order_id: orderId,
            menu_item_id: item.id,
            quantity: quantity,
            unit_price: item.price,
            total_price: price,
            status: itemStatus, // 'preparing' hoặc 'served'
            created_at: createdAt.toISOString()
        });
        totalAmount += price;
    }

    const { error } = await supabase.from('order_items').insert(itemsToInsert);
    if (!error) {
        await supabase.from('orders').update({ total_amount: totalAmount }).eq('id', orderId);
    }
}

fixData();