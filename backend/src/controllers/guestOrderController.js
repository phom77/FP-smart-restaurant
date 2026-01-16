const supabase = require('../config/supabaseClient');

// POST /api/users/claim-orders - Claim guest orders after login
exports.claimGuestOrders = async (req, res) => {
    try {
        const userId = req.user.id; // From JWT token
        const { guestOrderIds } = req.body; // Array of order IDs from guest session

        if (!guestOrderIds || !Array.isArray(guestOrderIds) || guestOrderIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có đơn hàng nào để claim'
            });
        }

        // Update all guest orders to assign them to the logged-in customer
        const { data: updatedOrders, error } = await supabase
            .from('orders')
            .update({ customer_id: userId, updated_at: new Date().toISOString() })
            .in('id', guestOrderIds)
            .is('customer_id', null) // Only claim orders that don't have a customer yet
            .select();

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: `Đã claim ${updatedOrders.length} đơn hàng`,
            claimed_orders: updatedOrders.length
        });

    } catch (err) {
        console.error('Claim Guest Orders Error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi claim đơn hàng',
            error: err.message
        });
    }
};
