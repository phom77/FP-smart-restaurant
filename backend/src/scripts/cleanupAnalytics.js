const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and (SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY) must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('🧹 Starting Cleanup of Seeded Data...');

    const logPath = path.join(__dirname, 'seeded_ids.json');

    if (!fs.existsSync(logPath)) {
        console.error('Error: seeded_ids.json not found. Nothing to cleanup.');
        return;
    }

    const seededIds = JSON.parse(fs.readFileSync(logPath, 'utf8'));

    if (!seededIds.length) {
        console.log('No IDs to delete.');
        return;
    }

    console.log(`Deleting ${seededIds.length} seeded orders...`);

    // Delete order_items first (if no cascade)
    const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .in('order_id', seededIds);

    if (itemsError) {
        console.error('Error deleting seeded order items:', itemsError);
    } else {
        console.log('Seeded order items deleted.');
    }

    // Delete orders
    const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .in('id', seededIds);

    if (ordersError) {
        console.error('Error deleting seeded orders:', ordersError);
    } else {
        console.log('Seeded orders deleted successfully.');
        // Remove the log file
        fs.unlinkSync(logPath);
        console.log('seeded_ids.json removed.');
    }

    console.log('✅ Cleanup finished!');
}

cleanup();
