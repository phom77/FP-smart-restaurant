const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and (SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY) must be set in .env');
    console.log('Available keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('🚀 Starting Data Seeding for Analytics...');

    // 1. Fetch Menu Items and Tables
    const { data: menuItems, error: menuError } = await supabase.from('menu_items').select('*');
    const { data: tables, error: tableError } = await supabase.from('tables').select('*');

    if (menuError || tableError) {
        console.error('Error fetching baseline data:', menuError || tableError);
        return;
    }

    if (!menuItems?.length || !tables?.length) {
        console.error('Error: No menu items or tables found. Please add some first.');
        return;
    }

    console.log(`Found ${menuItems.length} menu items and ${tables.length} tables.`);

    // 2. Generate Orders
    const numOrders = 150; // Increased for better density
    const now = new Date();
    const orders = [];

    const firstNames = ['An', 'Bình', 'Chi', 'Dương', 'Hải', 'Linh', 'Minh', 'Nam', 'Phong', 'Thảo', 'Việt', 'Yến'];
    const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ'];

    console.log(`Generating ${numOrders} orders with realistic patterns...`);

    for (let i = 0; i < numOrders; i++) {
        let date;
        let isQuietTime = true;

        // Implementation of weighted distribution
        while (isQuietTime) {
            const daysAgo = Math.floor(Math.random() * 30);
            const randomHour = Math.floor(Math.random() * 24);
            const randomMin = Math.floor(Math.random() * 60);

            date = new Date(now);
            date.setDate(date.getDate() - daysAgo);
            date.setHours(randomHour, randomMin, 0);

            const dayOfWeek = date.getDay(); // 0 (Sun) to 6 (Sat)
            const hour = date.getHours();

            // 1. Weekly Weights: Fri(5), Sat(6), Sun(0) are busier
            let dayWeight = [5, 6, 0].includes(dayOfWeek) ? 1.5 : 0.8;

            // 2. Hourly Weights: 11-14 (Lunch), 18-21 (Dinner) are busier
            let hourWeight = 0.1; // Default low
            if (hour >= 11 && hour <= 14) hourWeight = 1.8;
            else if (hour >= 18 && hour <= 21) hourWeight = 2.5;
            else if (hour >= 15 && hour <= 17) hourWeight = 0.5;
            else if (hour >= 22 || hour <= 10) hourWeight = 0.2;

            if (Math.random() < (dayWeight * hourWeight) / 2.5) {
                isQuietTime = false;
            }
        }

        const table = tables[Math.floor(Math.random() * tables.length)];
        const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lName = lastNames[Math.floor(Math.random() * lastNames.length)];

        orders.push({
            table_id: table.id,
            status: 'completed',
            total_amount: 0,
            created_at: date.toISOString(),
        });
    }

    // 3. Insert Orders and Items
    const seededIds = [];
    for (let i = 0; i < orders.length; i++) {
        const orderData = orders[i];

        // Insert Order
        const { data: newOrder, error: orderInsertError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

        if (orderInsertError) {
            console.error(`Error inserting order ${i}:`, orderInsertError);
            continue;
        }

        seededIds.push(newOrder.id);

        // Generate 1-4 random items for this order
        const numItems = Math.floor(Math.random() * 4) + 1;
        const orderItems = [];
        let totalAmount = 0;

        for (let j = 0; j < numItems; j++) {
            const menuItem = menuItems[Math.floor(Math.random() * menuItems.length)];
            const quantity = Math.floor(Math.random() * 2) + 1;
            const price = menuItem.price * quantity;

            orderItems.push({
                order_id: newOrder.id,
                menu_item_id: menuItem.id,
                quantity: quantity,
                unit_price: menuItem.price,
                total_price: price,
                status: 'served',
                created_at: orderData.created_at
            });
            totalAmount += price;
        }

        // Insert Order Items
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

        if (itemsError) {
            console.error(`Error inserting items for order ${newOrder.id}:`, itemsError);
        }

        // Update Order total
        await supabase
            .from('orders')
            .update({ total_amount: totalAmount })
            .eq('id', newOrder.id);

        if ((i + 1) % 10 === 0) {
            console.log(`Progress: ${i + 1}/${numOrders} orders seeded...`);
        }
    }

    // 4. Save IDs for Undo
    const logPath = path.join(__dirname, 'seeded_ids.json');
    fs.writeFileSync(logPath, JSON.stringify(seededIds, null, 2));
    console.log(`✅ Seeding completed! IDs saved to ${logPath} for undo functionality.`);
}

seed();
