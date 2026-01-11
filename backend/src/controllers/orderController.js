const supabase = require('../config/supabaseClient');
const { getIO } = require('../config/socket');
const { updateOrderStatusSchema } = require('../utils/validation');

// GET /api/waiter/orders
exports.getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('orders')
      .select(`
                *,
                table:tables(id, table_number),
                customer:users(id, full_name, phone),
                items:order_items(
                    id, 
                    quantity, 
                    unit_price, 
                    total_price, 
                    notes, 
                    status,
                    menu_item:menu_items(id, name, image_url),
                    modifiers:order_item_modifiers(id, modifier_name, price)
                )
            `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: data,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error("Get Orders Error:", err);
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách đơn hàng', error: err.message });
  }
};

// PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 1. Validation (Strict Input)
    const { error: validationError } = updateOrderStatusSchema.validate({ status });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError.details[0].message });
    }

    // 2. Manual Logic (No RPC/DB Transaction due to constraints)

    // A. Get current order to check transitions and table_id
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('status, table_id')
      .eq('id', id)
      .single();

    if (fetchError || !currentOrder) {
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    }

    // B. Update Order Status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // C. Automate Table Status (Best effort)
    if (updatedOrder.table_id) {
      let newTableStatus = null;

      // Pending -> Processing => Occupied
      if (status === 'processing' && currentOrder.status === 'pending') {
        newTableStatus = 'occupied';
      }
      // Processing -> Completed => Available (or Dirty)
      else if (status === 'completed' && currentOrder.status === 'processing') {
        newTableStatus = 'available'; // Simplified as per request
      }

      if (newTableStatus) {
        await supabase
          .from('tables')
          .update({ status: newTableStatus })
          .eq('id', updatedOrder.table_id);
      }
    }

    // 3. Socket Emit (Real-time updates)
    const io = getIO();

    // Notify Waiter Dashboard
    io.to('waiter').emit('order_status_updated', {
      order_id: id,
      status: status,
      updated_at: new Date()
    });

    // Notify specific Table (Customer view)
    if (updatedOrder.table_id) {
      io.to(`table_${updatedOrder.table_id}`).emit('order_status_update', {
        status: status,
        order_id: id
      });
    }

    // If switching to processing, maybe notify Kitchen as well
    if (status === 'processing') {
      io.to('kitchen').emit('order_processing', { order_id: id });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: updatedOrder
    });

  } catch (err) {
    console.error("Update Order Status Error:", err);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái', error: err.message });
  }
};

exports.createOrder = async (req, res) => {
  const { table_id, items, customer_id, notes } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
  }

  try {
    const menuItemIds = items.map(item => item.menu_item_id);
    let modifierIds = [];
    items.forEach(item => {
      if (item.modifiers) modifierIds = [...modifierIds, ...item.modifiers];
    });

    const { data: dbMenuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, price, name')
      .in('id', menuItemIds);

    if (menuError) throw menuError;

    const { data: dbModifiers, error: modError } = await supabase
      .from('modifiers')
      .select('id, price_adjustment, name')
      .in('id', modifierIds);

    if (modError) throw modError;

    const menuMap = new Map(dbMenuItems.map(i => [i.id, i]));
    const modMap = new Map(dbModifiers.map(m => [m.id, m]));

    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const dbItem = menuMap.get(item.menu_item_id);
      if (!dbItem) {
        return res.status(400).json({ success: false, message: `Món ăn ID ${item.menu_item_id} không tồn tại` });
      }

      let itemUnitPrice = parseFloat(dbItem.price);
      let modifiersData = [];

      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(modId => {
          const dbMod = modMap.get(modId);
          if (dbMod) {
            itemUnitPrice += parseFloat(dbMod.price_adjustment);
            modifiersData.push({
              modifier_id: modId,
              modifier_name: dbMod.name,
              price: dbMod.price_adjustment
            });
          }
        });
      }

      const itemTotalPrice = itemUnitPrice * item.quantity;
      totalAmount += itemTotalPrice;

      orderItemsData.push({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: itemUnitPrice,
        total_price: itemTotalPrice,
        notes: item.notes,
        modifiers: modifiersData
      });
    }

    const { data: newOrder, error: orderInsertError } = await supabase
      .from('orders')
      .insert([{
        table_id,
        customer_id: customer_id || null,
        status: 'pending',
        total_amount: totalAmount,
        payment_method: 'pay_later',
      }])
      .select()
      .single();

    if (orderInsertError) throw orderInsertError;

    for (const itemData of orderItemsData) {
      const { data: newOrderItem, error: itemInsertError } = await supabase
        .from('order_items')
        .insert([{
          order_id: newOrder.id,
          menu_item_id: itemData.menu_item_id,
          quantity: itemData.quantity,
          unit_price: itemData.unit_price,
          total_price: itemData.total_price,
          notes: itemData.notes,
          status: 'pending'
        }])
        .select()
        .single();

      if (itemInsertError) throw itemInsertError;

      if (itemData.modifiers.length > 0) {
        const modifierInserts = itemData.modifiers.map(mod => ({
          order_item_id: newOrderItem.id,
          modifier_id: mod.modifier_id,
          modifier_name: mod.modifier_name,
          price: mod.price
        }));

        const { error: modInsertError } = await supabase
          .from('order_item_modifiers')
          .insert(modifierInserts);

        if (modInsertError) throw modInsertError;
      }
    }

    const io = getIO();

    io.to('kitchen').to('waiter').emit('new_order', {
      order_id: newOrder.id,
      table_id: table_id,
      items: orderItemsData,
      created_at: newOrder.created_at
    });

    io.to(`table_${table_id}`).emit('order_status_update', {
      status: 'pending',
      order_id: newOrder.id
    });

    res.status(201).json({
      success: true,
      message: 'Đặt món thành công',
      order_id: newOrder.id,
      total_amount: totalAmount
    });

  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ success: false, message: 'Lỗi xử lý đơn hàng', error: err.message });
  }
};