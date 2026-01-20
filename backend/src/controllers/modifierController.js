const supabase = require('../config/supabaseClient');

// --- MODIFIER GROUPS ---

// Get all modifier groups with their modifiers
exports.getModifierGroups = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('modifier_groups')
            .select(`
                *,
                modifiers (*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Create a new modifier group
exports.createModifierGroup = async (req, res) => {
    try {
        const { name, min_selection, max_selection } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

        const { data, error } = await supabase
            .from('modifier_groups')
            .insert([{ name, min_selection, max_selection }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update a modifier group
exports.updateModifierGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, min_selection, max_selection } = req.body;

        const { data, error } = await supabase
            .from('modifier_groups')
            .update({ name, min_selection, max_selection })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete a modifier group
exports.deleteModifierGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('modifier_groups')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.status(200).json({ success: true, message: 'Modifier group deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// --- MODIFIERS ---

// Create a modifier within a group
exports.createModifier = async (req, res) => {
    try {
        const { group_id, name, price_modifier, is_available } = req.body;
        if (!group_id || !name) return res.status(400).json({ success: false, message: 'Group ID and Name are required' });

        const { data, error } = await supabase
            .from('modifiers')
            .insert([{ group_id, name, price_modifier, is_available }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update a modifier
exports.updateModifier = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price_modifier, is_available } = req.body;

        const { data, error } = await supabase
            .from('modifiers')
            .update({ name, price_modifier, is_available })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.status(200).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete a modifier
exports.deleteModifier = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('modifiers')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.status(200).json({ success: true, message: 'Modifier deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// --- MENU ITEM LINKS ---

// Link a modifier group to a menu item
exports.linkModifierGroup = async (req, res) => {
    try {
        const { menu_item_id, modifier_group_id } = req.body;
        const { data, error } = await supabase
            .from('menu_item_modifier_groups')
            .insert([{ menu_item_id, modifier_group_id }])
            .select();

        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Unlink a modifier group from a menu item
exports.unlinkModifierGroup = async (req, res) => {
    try {
        const { menu_item_id, modifier_group_id } = req.params;
        const { error } = await supabase
            .from('menu_item_modifier_groups')
            .delete()
            .eq('menu_item_id', menu_item_id)
            .eq('modifier_group_id', modifier_group_id);

        if (error) throw error;
        res.status(200).json({ success: true, message: 'Unlinked successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get modifier groups for a specific menu item
exports.getMenuItemModifierGroups = async (req, res) => {
    try {
        const { menu_item_id } = req.params;
        const { data, error } = await supabase
            .from('menu_item_modifier_groups')
            .select(`
                modifier_group_id,
                modifier_groups (
                    *,
                    modifiers (*)
                )
            `)
            .eq('menu_item_id', menu_item_id);

        if (error) throw error;
        res.status(200).json({ success: true, data: data.map(item => item.modifier_groups) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
