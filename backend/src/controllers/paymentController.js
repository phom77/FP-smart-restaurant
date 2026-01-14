const supabase = require('../config/supabaseClient');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const { getIO } = require('../config/socket');

// 1. Tạo Payment Intent
exports.createPaymentIntent = async (req, res) => {
    const { orderId, paymentMethod } = req.body;

    try {
        const { data: order } = await supabase
            .from('orders')
            .select('total_amount, status, table_id')
            .eq('id', orderId)
            .single();

        if (!order) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });

        // --- TIỀN MẶT ---
        if (paymentMethod === 'cash') {
            // 1. Update DB trước (Quan trọng để khi Frontend fetch lại sẽ thấy status mới)
            await supabase.from('orders')
                .update({ payment_status: 'waiting_payment' })
                .eq('id', orderId);

            const io = getIO();

            // 2. Báo cho Waiter (Sự kiện: payment_request)
            io.to('waiter').emit('payment_request', {
                orderId,
                tableId: order.table_id,
                message: `Bàn yêu cầu thanh toán tiền mặt`
            });

            // 3. Báo cho Khách (Sự kiện: payment_status_update)
            if (order.table_id) {
                io.to(`table_${order.table_id}`).emit('payment_status_update', {
                    orderId,
                    status: 'waiting_payment'
                });
            }

            return res.json({ success: true, method: 'cash', message: 'Đã gửi yêu cầu hỗ trợ' });
        }

        // --- THẺ (STRIPE) ---
        if (paymentMethod === 'card') {
            // Kiểm tra xem đã cấu hình Key chưa
            if (!stripe) {
                console.warn("⚠️ Chưa có STRIPE_SECRET_KEY, chuyển sang chế độ Mock");
                return res.json({ success: true, clientSecret: 'mock_secret_' + orderId, isMock: true });
            }

            // Tạo Intent thật với Stripe
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(order.total_amount), // Stripe tính theo đơn vị nhỏ nhất (VND là đồng)
                currency: 'vnd',
                metadata: { orderId: orderId }, // Gắn ID đơn hàng để tra cứu sau này
                automatic_payment_methods: { enabled: true },
            });

            console.log("✅ Stripe Intent Created:", paymentIntent.id);

            return res.json({
                success: true,
                method: 'card',
                clientSecret: paymentIntent.client_secret, // Trả về chìa khóa cho Frontend
                isMock: false
            });
        }

    } catch (err) {
        console.error("Payment Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Mock Payment (Sửa lại để bắn Socket cho khách)
exports.mockPayment = async (req, res) => {
    const { orderId } = req.body;

    try {
        // Lấy thông tin bàn để bắn socket
        const { data: order } = await supabase.from('orders').select('table_id').eq('id', orderId).single();

        // Update DB
        await supabase.from('orders').update({ payment_status: 'paid', status: 'completed' }).eq('id', orderId);

        // Bắn socket
        const io = getIO();
        // Báo cho Waiter
        io.to('waiter').emit('order_paid', { orderId });
        if (order && order.table_id) {
            await supabase.from('tables').update({ status: 'available' }).eq('id', order.table_id);

            io.to(`table_${order.table_id}`).emit('payment_success', { orderId, status: 'paid' });
        }

        res.json({ success: true, message: "Thanh toán giả lập thành công" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3. --- 🟢 THÊM MỚI: Xác nhận thanh toán Stripe (Gọi từ Frontend) ---
exports.confirmPayment = async (req, res) => {
    const { paymentIntentId, orderId } = req.body;

    try {
        if (!stripe) return res.status(400).json({ message: "Stripe not configured" });

        // Kiểm tra trạng thái trên Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            // Update DB ngay lập tức
            await supabase.from('orders').update({
                payment_status: 'paid'
            }).eq('id', orderId);

            // Lưu lịch sử
            await supabase.from('payments').insert([{
                order_id: orderId,
                transaction_code: paymentIntent.id,
                amount: paymentIntent.amount,
                gateway: 'stripe',
                status: 'success',
                response_log: paymentIntent
            }]);

            // Bắn Socket cập nhật UI ngay
            const { data: order } = await supabase.from('orders').select('table_id').eq('id', orderId).single();
            const io = getIO();

            io.to('waiter').emit('order_paid', { orderId });
            if (order && order.table_id) {
                // --- 🟢 FIX: Giải phóng bàn ---
                await supabase.from('tables').update({ status: 'available' }).eq('id', order.table_id);

                io.to(`table_${order.table_id}`).emit('payment_success', { orderId, status: 'paid' });
            }

            return res.json({ success: true });
        } else {
            return res.status(400).json({ success: false, message: "Thanh toán chưa hoàn tất" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};
// 2. Webhook (Nhận kết quả từ Stripe)
exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Verify chữ ký (Bảo mật)
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        // Nếu test local không có webhook secret thì bỏ qua verify (Chỉ dùng cho dev)
        event = req.body;
    }

    // Xử lý sự kiện thanh toán thành công
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;

        console.log(`💰 Thanh toán thành công cho đơn: ${orderId}`);

        // Update DB
        await supabase.from('orders').update({
            payment_status: 'paid',
            status: 'completed' // Hoặc giữ processing tùy quy trình
        }).eq('id', orderId);

        // Lưu lịch sử giao dịch
        await supabase.from('payments').insert([{
            order_id: orderId,
            transaction_code: paymentIntent.id,
            amount: paymentIntent.amount,
            gateway: 'stripe',
            status: 'success',
            response_log: paymentIntent
        }]);

        // Bắn Socket báo cho Waiter và Khách
        const io = getIO();
        io.to(`table_${orderId}`).emit('payment_success', { orderId });
        io.to('waiter').emit('order_paid', { orderId });

        // --- 🟢 FIX: Giải phóng bàn ---
        const { data: orderInfo } = await supabase.from('orders').select('table_id').eq('id', orderId).single();
        if (orderInfo?.table_id) {
            await supabase.from('tables').update({ status: 'available' }).eq('id', orderInfo.table_id);
        }
    }

    res.json({ received: true });
};

exports.confirmCashPayment = async (req, res) => {
    const { orderId } = req.body;
    try {
        // Update DB
        await supabase.from('orders').update({
            payment_status: 'paid',
            status: 'completed' // Đóng đơn luôn
        }).eq('id', orderId);

        // Lưu lịch sử
        await supabase.from('payments').insert([{
            order_id: orderId,
            amount: 0, // Hoặc query lấy amount
            gateway: 'cash',
            status: 'success',
            transaction_code: `CASH-${Date.now()}`
        }]);

        // Bắn socket báo cho Khách và Waiter (để refresh UI)
        const io = getIO();
        const { data: order } = await supabase.from('orders').select('table_id').eq('id', orderId).single();

        if (order?.table_id) {
            await supabase.from('tables').update({ status: 'available' }).eq('id', order.table_id);

            io.to(`table_${order.table_id}`).emit('payment_success', { orderId, status: 'paid' });
        }

        io.to('waiter').emit('order_paid', { orderId });

        res.json({ success: true, message: "Đã xác nhận thu tiền" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};