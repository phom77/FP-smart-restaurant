const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
// Dùng SERVICE_KEY để có quyền xóa bất chấp RLS
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- HÀM TIỆN ÍCH ---
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- LOGIC KIỂM TRA TRÙNG GIỜ ---
// Trả về true nếu thời gian 'newTime' bị trùng với lịch cũ của bàn (cách nhau dưới 30p)
function isTableBusy(tableHistory, newTime) {
    if (!tableHistory || tableHistory.length === 0) return false;
    const THIRTY_MINUTES = 30 * 60 * 1000;

    // Kiểm tra từng mốc thời gian đã có
    return tableHistory.some(existingTime => {
        const diff = Math.abs(existingTime - newTime.getTime());
        return diff < THIRTY_MINUTES; // Nếu khoảng cách < 30p nghĩa là đang bận
    });
}

async function fixData() {
    console.log('🗑️  BẮT ĐẦU DỌN DẸP DỮ LIỆU RÁC...');

    // 1. XÓA SẠCH DỮ LIỆU (Clean Slate)

    await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { error: errItems } = await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errItems) console.error('Lỗi xóa items:', errItems.message);

    const { error: errOrders } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errOrders) console.error('Lỗi xóa orders:', errOrders.message);

    // Reset trạng thái bàn
    await supabase.from('tables').update({ status: 'available' }).neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('✨ Đã xóa sạch dữ liệu cũ. Database giờ như mới.');

    // 2. CHUẨN BỊ DỮ LIỆU GỐC
    const { data: menuItems } = await supabase.from('menu_items').select('*');
    const { data: tables } = await supabase.from('tables').select('*');

    if (!menuItems?.length || !tables?.length) {
        console.error('❌ Lỗi: Cần có dữ liệu Menu và Bàn.');
        return;
    }

    // 3. TẠO ĐƠN HÀNG ĐANG ĂN (ACTIVE)
    console.log('🔄 Đang tạo dữ liệu Active Order (Khách đang ngồi)...');

    const shuffledTables = [...tables].sort(() => 0.5 - Math.random());
    const activeTables = shuffledTables.slice(0, 4);

    // Object lưu lịch sử dùng bàn để tránh trùng lặp ở bước sau
    const tableUsageMap = {}; // { tableId: [timestamp1, timestamp2] }

    for (const table of activeTables) {
        await supabase.from('tables').update({ status: 'occupied' }).eq('id', table.id);

        const now = new Date();
        now.setMinutes(now.getMinutes() - getRandomInt(5, 50));

        // Lưu lại giờ khách này đang ngồi để bước sau không random trúng
        if (!tableUsageMap[table.id]) tableUsageMap[table.id] = [];
        tableUsageMap[table.id].push(now.getTime());

        const { data: newOrder } = await supabase
            .from('orders')
            .insert({
                table_id: table.id,
                status: 'processing',
                total_amount: 0,
                created_at: now.toISOString(),
            })
            .select().single();

        if (newOrder) await createRandomItems(newOrder.id, menuItems, now, 'preparing');
    }

    // 4. TẠO LỊCH SỬ ĐƠN HÀNG (COMPLETED) - CÓ CHECK TRÙNG GIỜ
    console.log('📜 Đang tạo dữ liệu Lịch sử (Logic không trùng 30p)...');
    const historyCount = 30;
    let createdCount = 0;

    // Lặp cho đến khi tạo đủ số lượng (hoặc hết kiên nhẫn sau 100 lần thử)
    let attempts = 0;
    while (createdCount < historyCount && attempts < 200) {
        attempts++;

        // A. Random Ngày & Giờ (Logic Peak Hour cũ)
        const date = new Date();
        date.setDate(date.getDate() - getRandomInt(0, 7)); // Trong 7 ngày qua
        const rand = Math.random();
        if (rand < 0.4) date.setHours(getRandomInt(11, 13));      // Trưa
        else if (rand < 0.8) date.setHours(getRandomInt(18, 20)); // Tối
        else date.setHours(getRandomInt(8, 21));                  // Giờ khác
        date.setMinutes(getRandomInt(0, 59));

        // B. TÌM BÀN TRỐNG VÀO GIỜ ĐÓ
        // Xáo trộn danh sách bàn để thử ngẫu nhiên
        const randomTables = [...tables].sort(() => 0.5 - Math.random());
        let selectedTable = null;

        for (const table of randomTables) {
            // Check xem bàn này giờ đó có bận không?
            if (!isTableBusy(tableUsageMap[table.id], date)) {
                selectedTable = table;
                break; // Tìm thấy bàn trống!
            }
        }

        // C. NẾU TÌM ĐƯỢC BÀN HỢP LỆ -> TẠO ORDER
        if (selectedTable) {
            // Lưu lại giờ vào sổ
            if (!tableUsageMap[selectedTable.id]) tableUsageMap[selectedTable.id] = [];
            tableUsageMap[selectedTable.id].push(date.getTime());

            const { data: newOrder } = await supabase
                .from('orders')
                .insert({
                    table_id: selectedTable.id,
                    status: 'completed',
                    total_amount: 0,
                    created_at: date.toISOString(),
                })
                .select().single();

            if (newOrder) {
                await createRandomItems(newOrder.id, menuItems, date, 'served');

                // Tạo Payment
                const paymentTime = new Date(date.getTime() + getRandomInt(30, 45) * 60000);
                await supabase.from('payments').insert({
                    order_id: newOrder.id,
                    amount: 0,
                    transaction_code: `TRANS_${paymentTime.getTime()}_${getRandomInt(100, 999)}`,
                    gateway: getRandomItem(['Momo', 'ZaloPay', 'Cash']),
                    status: 'completed',
                    created_at: paymentTime.toISOString()
                });

                createdCount++;
            }
        }
        // Nếu không tìm được bàn nào trống giờ đó -> Vòng lặp while sẽ chạy lại, random giờ khác
    }

    console.log(`✅ Đã tạo thành công ${createdCount} đơn hàng lịch sử.`);
}

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
            status: itemStatus,
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