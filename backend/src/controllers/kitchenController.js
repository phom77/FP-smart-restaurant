const supabase = require('../config/supabaseClient');
const { getIO } = require('../config/socket');

// GET /api/kitchen/items - Lấy danh sách đơn hàng cho Bếp
exports.getKitchenItems = async (req, res) => {
  try {
    // 1. Lấy các đơn hàng ĐANG XỬ LÝ (đã được Waiter duyệt)
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id, created_at, status, notes,
        tables (table_number),
        order_items (
          id, quantity, notes, status, created_at,
          menu_items (id, name, image_url),
          order_item_modifiers (modifier_name)
        )
      `)
      .eq('status', 'processing') // Chỉ lấy đơn đã duyệt (Processing)
      .order('created_at', { ascending: true }); // FIFO

    if (error) throw error;

    // 2. Lọc món ăn để hiển thị (Logic lọc mở rộng)
    const cleanOrders = orders.map(order => {
        // Bếp cần thấy món trong các trường hợp sau:
        // - 'pending': Món mới duyệt, chưa kịp chuyển sang preparing (Fix lỗi hiện tại của bạn)
        // - 'preparing': Đang nấu
        // - 'ready': Đã xong nhưng chưa bưng (Vẫn cần hiện để biết)
        const activeItems = order.order_items.filter(item => 
            ['pending', 'preparing', 'ready'].includes(item.status)
        );
        
        return {
            ...order,
            order_items: activeItems
        };
    }).filter(order => order.order_items.length > 0); // Chỉ hiện đơn còn món

    res.status(200).json({ success: true, data: cleanOrders });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/kitchen/items/:id - Cập nhật trạng thái món (Nấu xong)
exports.updateItemStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // 1. Update DB
    const { data: updatedItem, error } = await supabase
      .from('order_items')
      .update({ status })
      .eq('id', id)
      .select('order_id, menu_items(name)')
      .single();

    if (error) throw error;

    const io = getIO();

    // 2. Bắn Socket cho WAITER
    io.to('waiter').emit('item_status_update', {
      itemId: id,
      order_id: updatedItem.order_id,
      status: status,
      message: `Món ${updatedItem.menu_items?.name} chuyển sang ${status}`
    });

    // 3. Bắn Socket cho KITCHEN (Sync các màn hình bếp khác)
    io.to('kitchen').emit('kitchen_item_update', {
      itemId: id,
      order_id: updatedItem.order_id,
      status: status
    });

    // 4. Check nếu cả đơn xong thì báo Waiter (Order Ready)
    if (status === 'ready') {
      // Kiểm tra xem còn món nào chưa xong không (pending hoặc preparing)
      const { count } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', updatedItem.order_id)
        .in('status', ['pending', 'preparing']); 

      if (count === 0) {
        io.to('waiter').emit('order_ready_notification', {
          order_id: updatedItem.order_id,
          message: '✅ Đơn hàng đã hoàn tất!'
        });
      }
    }

    res.status(200).json({ success: true, data: updatedItem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};