const supabase = require('../config/supabaseClient');

exports.getKitchenItems = async (req, res) => {
  try {
    // 1. Lấy dữ liệu thô (Flat list)
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        id, quantity, notes, status, created_at,
        menu_items (id, name, image_url),
        orders (table_id, tables (table_number)),
        order_item_modifiers (modifier_name)
      `)
      .in('status', ['pending', 'preparing']) // Lấy cả pending để bếp biết sắp có gì
      .order('created_at', { ascending: true }); // Cũ nhất lên đầu

    if (error) throw error;

    // 2. LOGIC GOM NHÓM (GROUPING)
    const groupedItems = [];

    data.forEach(item => {
      // Tạo một "chữ ký" duy nhất cho món ăn để so sánh
      // Signature = ItemID + Status + Notes + Modifiers (đã sort)
      const modifiersStr = item.order_item_modifiers
        .map(m => m.modifier_name).sort().join(',');

      const signature = `${item.menu_items.id}-${item.status}-${item.notes || ''}-${modifiersStr}`;

      // Tìm xem nhóm này đã tồn tại chưa
      const existingGroup = groupedItems.find(g => g.signature === signature);

      if (existingGroup) {
        // Nếu có rồi -> Cộng dồn số lượng và thêm ID vào danh sách con
        existingGroup.total_quantity += item.quantity;
        existingGroup.ids.push(item.id); // Lưu lại ID để xử lý update sau này
        existingGroup.tables.push(item.orders?.tables?.table_number); // Lưu danh sách bàn
      } else {
        // Nếu chưa -> Tạo nhóm mới
        groupedItems.push({
          signature: signature,
          menu_item_id: item.menu_items.id,
          name: item.menu_items.name,
          image_url: item.menu_items.image_url,
          status: item.status,
          notes: item.notes,
          modifiers: item.order_item_modifiers.map(m => m.modifier_name),
          total_quantity: item.quantity,
          created_at: item.created_at, // Lấy thời gian của món đầu tiên (đợi lâu nhất)
          ids: [item.id], // Danh sách các order_item_id con
          tables: [item.orders?.tables?.table_number]
        });
      }
    });

    // Format lại danh sách bàn cho đẹp (VD: "Bàn T1, T2")
    groupedItems.forEach(g => {
      g.table_list = [...new Set(g.tables)].join(', ');
    });

    res.status(200).json({ success: true, data: groupedItems });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateItemStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // 1. Update trạng thái món
    const { data: updatedItem, error } = await supabase
      .from('order_items')
      .update({ status })
      .eq('id', id)
      .select('order_id, menu_items(name)') // Lấy thêm order_id để check
      .single();

    if (error) throw error;

    const { getIO } = require('../config/socket');
    const io = getIO();

    // 2. Bắn socket báo món này đã xong (Logic cũ)
    io.to('waiter').emit('item_status_update', {
      itemId: id,
      order_id: updatedItem.order_id, // Gửi thêm order_id để FE dễ xử lý
      status: status,
      message: `Món ${updatedItem.menu_items?.name} đã chuyển sang ${status}`
    });

    if (status === 'ready') {
      // Đếm xem trong đơn này còn món nào chưa xong không
      const { count } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', updatedItem.order_id)
        .neq('status', 'ready') // Đếm những món CHƯA ready
        .neq('status', 'served') // Và chưa served
        .neq('status', 'cancelled');

      if (count === 0) {
        io.to('waiter').emit('order_ready_notification', {
          order_id: updatedItem.order_id,
          message: '✅ Toàn bộ món ăn của đơn hàng đã Sẵn sàng!'
        });
      }
    }

    res.status(200).json({ success: true, data: updatedItem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};