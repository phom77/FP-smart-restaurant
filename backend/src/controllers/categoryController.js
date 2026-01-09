const supabase = require('../config/supabaseClient');

exports.getAllCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- ADMIN OPERATIONS ---

// POST /api/admin/categories
exports.createCategory = async (req, res) => {
  try {
    const { name, image_url, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    // Check for duplicates
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', name)
      .single();

    if (existing) {
      return res.status(400).json({ success: false, error: 'Category with this name already exists' });
    }

    // Check for duplicate sort_order
    if (sort_order !== undefined) {
      const { data: existingOrder } = await supabase
        .from('categories')
        .select('id')
        .eq('sort_order', sort_order)
        .single();

      if (existingOrder) {
        return res.status(400).json({ success: false, error: `Category with order ${sort_order} already exists` });
      }
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, image_url, sort_order }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: data,
      message: 'Category created successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/admin/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check for duplicates if name is being updated
    if (updates.name) {
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', updates.name)
        .neq('id', id)
        .single();

      if (existing) {
        return res.status(400).json({ success: false, error: 'Category with this name already exists' });
      }
    }

    // Check for duplicate sort_order if it's being updated
    if (updates.sort_order !== undefined) {
      const { data: existingOrder } = await supabase
        .from('categories')
        .select('id')
        .eq('sort_order', updates.sort_order)
        .neq('id', id)
        .single();

      if (existingOrder) {
        return res.status(400).json({ success: false, error: `Category with order ${updates.sort_order} already exists` });
      }
    }

    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: data,
      message: 'Category updated successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/admin/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};