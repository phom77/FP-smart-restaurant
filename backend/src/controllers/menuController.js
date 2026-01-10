const supabase = require('../config/supabaseClient');

// GET /api/menu/items - Get all menu items with filters
exports.getMenuItems = async (req, res) => {
    try {
        const { category_id, search, sort_by = 'name', is_available } = req.query;

        let query = supabase
            .from('menu_items')
            .select(`
        *,
        category:categories(id, name)
      `);

        // Filter by category
        if (category_id) {
            query = query.eq('category_id', category_id);
        }

        // Filter by availability
        if (is_available !== undefined) {
            query = query.eq('is_available', is_available === 'true');
        }

        // Search by name
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        // Sort
        if (sort_by === 'price_asc') {
            query = query.order('price', { ascending: true });
        } else if (sort_by === 'price_desc') {
            query = query.order('price', { ascending: false });
        } else {
            query = query.order('name', { ascending: true });
        }

        const { data, error } = await query;

        if (error) throw error;

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// GET /api/menu/items/:id - Get single menu item with modifiers
exports.getMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        // Get menu item
        const { data: item, error: itemError } = await supabase
            .from('menu_items')
            .select(`
        *,
        category:categories(id, name)
      `)
            .eq('id', id)
            .single();

        if (itemError) throw itemError;
        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Menu item not found'
            });
        }

        // Get modifier groups for this item
        const { data: modifierGroups, error: mgError } = await supabase
            .from('item_modifier_groups')
            .select(`
        modifier_group:modifier_groups(
          id,
          name,
          min_selection,
          max_selection,
          modifiers(id, name, price_adjustment, is_available)
        )
      `)
            .eq('menu_item_id', id);

        if (mgError) throw mgError;

        // Flatten the structure
        const modifiers = modifierGroups?.map(mg => mg.modifier_group) || [];

        res.status(200).json({
            success: true,
            data: {
                ...item,
                modifier_groups: modifiers
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// GET /api/menu/items/:id/reviews - Get reviews for a menu item
exports.getMenuItemReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 10, offset = 0 } = req.query;

        const { data, error, count } = await supabase
            .from('reviews')
            .select(`
        *,
        user:users(id, full_name, avatar_url)
      `, { count: 'exact' })
            .eq('menu_item_id', id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.status(200).json({
            success: true,
            data: data,
            pagination: {
                total: count,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// --- ADMIN OPERATIONS ---

// POST /api/admin/menu-items
exports.createMenuItem = async (req, res) => {
    try {
        const { name, description, price, category_id, image_url, is_available } = req.body;

        // Basic validation
        if (!name || !price) {
            return res.status(400).json({ success: false, error: 'Name and price are required' });
        }

        // Check for duplicates
        const { data: existing } = await supabase
            .from('menu_items')
            .select('id')
            .ilike('name', name)
            .single();

        if (existing) {
            return res.status(400).json({ success: false, error: 'Menu item with this name already exists' });
        }

        const { data, error } = await supabase
            .from('menu_items')
            .insert([
                { name, description, price, category_id, image_url, is_available }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: data,
            message: 'Menu item created successfully'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// PUT /api/admin/menu-items/:id
exports.updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Check for duplicates if name is being updated
        if (updates.name) {
            const { data: existing } = await supabase
                .from('menu_items')
                .select('id')
                .ilike('name', updates.name)
                .neq('id', id)
                .single();

            if (existing) {
                return res.status(400).json({ success: false, error: 'Menu item with this name already exists' });
            }
        }

        const { data, error } = await supabase
            .from('menu_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({
            success: true,
            data: data,
            message: 'Menu item updated successfully'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// DELETE /api/admin/menu-items/:id
exports.deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('menu_items')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Menu item deleted successfully'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
