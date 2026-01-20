const supabase = require('../config/supabaseClient');
const { getIO } = require('../config/socket');

// GET /api/kitchen/items - Lấy danh sách đơn hàng cho Bếp
exports.getKitchenItems = async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id, 
        created_at, 
        status, 
        payment_status,
        tables (table_number),
        order_items (
          id, 
          quantity, 
          notes, 
          status, 
          created_at,
          menu_items (id, name, image_url),
          order_item_modifiers (id, modifier_name)
        )
      `)
      .eq('status', 'processing')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const filteredOrders = orders.map(order => {
      const activeItems = order.order_items.filter(item =>
        ['pending', 'preparing', 'ready'].includes(item.status)
      );

      return {
        ...order,
        order_items: activeItems
      };
    }).filter(order => order.order_items.length > 0);

    res.status(200).json({ success: true, data: filteredOrders });

  } catch (err) {
    console.error("Kitchen Get Items Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/kitchen/items/:id - Cập nhật trạng thái món
exports.updateItemStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'preparing', 'ready', 'served', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status không hợp lệ'
    });
  }

  try {
    // 1. Update DB & LẤY THÊM THÔNG TIN TABLE (Join orders)
    // Đã xóa comment trong chuỗi select để tránh lỗi cú pháp
    const { data: updatedItem, error } = await supabase
      .from('order_items')
      .update({ status })
      .eq('id', id)
      .select(`
        id,
        order_id,
        status,
        menu_items(name),
        orders (
            table_id
        )
      `)
      .single();

    if (error) throw error;

    const io = getIO();
    const itemName = updatedItem.menu_items?.name || 'Unknown';
    const tableId = updatedItem.orders?.table_id;

    // 2. Bắn Socket cho WAITER
    io.to('waiter').emit('item_status_update', {
      itemId: id,
      order_id: updatedItem.order_id,
      status: status,
      message: `Món ${itemName} → ${status}`
    });

    // 3. Bắn Socket cho KITCHEN (sync màn hình khác)
    io.to('kitchen').emit('kitchen_item_update', {
      itemId: id,
      order_id: updatedItem.order_id,
      status: status
    });

    // 4. Bắn Socket cho KHÁCH HÀNG (Tracking Page)
    if (tableId) {
      // console.log(`📢 Update item status for Customer at Table ${tableId}`);
      io.to(`table_${tableId}`).emit('item_status_update', {
        itemId: id,
        status: status,
        order_id: updatedItem.order_id
      });
    }

    // 5. Kiểm tra nếu CẢ ĐƠN đã xong
    if (status === 'ready') {
      const { count } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', updatedItem.order_id)
        .in('status', ['pending', 'preparing']);

      if (count === 0) {
        // Tất cả món đã ready
        io.to('waiter').emit('order_ready_notification', {
          order_id: updatedItem.order_id,
          message: '✅ Đơn hàng đã hoàn tất! Có thể phục vụ.'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: updatedItem,
      message: `Đã cập nhật ${itemName} thành ${status}`
    });

  } catch (err) {
    console.error("Update Item Status Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};