const supabase = require('../config/supabaseClient');
const { getIO } = require('../config/socket');

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
      .select('id, price, name, is_available')
      .in('id', menuItemIds);

    if (menuError) throw menuError;

    // Validation: Check if items are available
    const unavailableItems = dbMenuItems.filter(item => !item.is_available);
    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Món "${unavailableItems[0].name}" hiện không có sẵn`
      });
    }

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

// Get order details by ID
exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch order with nested data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        table:tables(id, table_number, capacity),
        order_items(
          *,
          menu_item:menu_items(id, name, image_url),
          order_item_modifiers(
            modifier_id,
            modifier_name,
            price
          )
        )
      `)
      .eq('id', id)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng'
        });
      }
      throw orderError;
    }

    res.status(200).json({
      success: true,
      data: order
    });

  } catch (err) {
    console.error("Get Order Error:", err);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin đơn hàng',
      error: err.message
    });
  }
};