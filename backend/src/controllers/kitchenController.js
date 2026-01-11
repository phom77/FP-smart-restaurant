const supabase = require('../config/supabaseClient');

exports.getKitchenItems = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        id,
        quantity,
        notes,
        status,
        created_at,
        menu_items (name, image_url),
        orders (table_id, tables (table_number)),
        order_item_modifiers (modifier_name)
      `)
      .in('status', ['pending', 'preparing'])
      .order('created_at', { ascending: true });

    if (error) throw error;

    const formattedData = data.map(item => ({
      id: item.id,
      name: item.menu_items?.name,
      quantity: item.quantity,
      notes: item.notes,
      status: item.status,
      table_number: item.orders?.tables?.table_number || 'Unknown',
      modifiers: item.order_item_modifiers.map(m => m.modifier_name),
      time_elapsed: new Date() - new Date(item.created_at) 
    }));

    res.status(200).json({ success: true, data: formattedData });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateItemStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; 

  try {
    const { data, error } = await supabase
      .from('order_items')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const { getIO } = require('../config/socket');
    getIO().to('waiter').emit('item_status_update', {
      itemId: id,
      status: status,
      message: `Món ăn đã chuyển sang ${status}`
    });

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};