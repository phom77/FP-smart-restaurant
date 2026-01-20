const supabase = require('../config/supabaseClient');
const { clearCache } = require('../middleware/cacheMiddleware');
const redisClient = require('../config/redisClient');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';

// GET /api/menu - Verify QR token and load data
exports.verifyMenuToken = async (req, res) => {
    try {
        const { table, token } = req.query;

        if (!table || !token) {
            return res.status(400).json({ success: false, error: 'Missing table identity or token' });
        }

        // 1. Verify JWT Signature
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtErr) {
            console.warn(`[SECURITY] QR JWT Verification Failed for table ${table}:`, jwtErr.message);
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired QR code. Please ask staff for assistance.'
            });
        }

        // 2. Check Database for matching token and table status
        const { data: tableData, error: tableError } = await supabase
            .from('tables')
            .select('*')
            .eq('id', table)
            .single();

        if (tableError || !tableData) {
            return res.status(404).json({ success: false, error: 'Table not found' });
        }

        if (tableData.qr_code_token !== token) {
            console.warn(`[SECURITY] Invalid token attempt for table ${tableData.table_number}. Token does not match database.`);
            return res.status(401).json({
                success: false,
                error: 'This QR code is no longer valid. Please ask staff for assistance.'
            });
        }

        // 3. Return Table Info (Menu items can be fetched separately or here)
        res.status(200).json({
            success: true,
            table: {
                id: tableData.id,
                number: tableData.table_number,
                location: tableData.location,
                status: tableData.status
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/menu/items - Get all menu items with filters and pagination
exports.getMenuItems = async (req, res) => {
    try {
        // 1. Get all parameters including pagination
        const {
            category_id,
            search,
            sort_by = 'name',
            is_available,
            chef_recommendation,
            page = 1,
            limit = 20
        } = req.query;

        // Calculate offset for pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // 2. Create Cache Key (include pagination and filters)
        const cacheKey = `menu_${category_id || 'all'}_${search || 'none'}_${sort_by}_${is_available || 'all'}_${chef_recommendation || 'all'}_page${page}_limit${limit}`;

        // 3. Check Redis cache first
        /* 
        try {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                console.log('⚡ Lấy Menu từ Redis Cache:', cacheKey);
                return res.status(200).json(JSON.parse(cachedData));
            }
        } catch (redisErr) {
            console.log('Redis lỗi (bỏ qua):', redisErr.message);
        }
        */

        // 4. Query Database with pagination
        let query = supabase
            .from('menu_items')
            .select(`*, category:categories(id, name)`, { count: 'exact' });

        // Filter by category
        if (category_id) {
            query = query.eq('category_id', category_id);
        }

        // Filter by availability (Backward compatibility)
        // Note: For customers, this is now handled by the 'status' logic below
        if (is_available !== undefined && req.query.admin_view !== 'true') {
            // If a customer tries to filter by is_available, we ignore it 
            // and let the status logic handle it to avoid conflicts
        } else if (is_available !== undefined) {
            query = query.eq('is_available', is_available === 'true');
        }

        // New Status Logic:
        // By default, hide 'unavailable' items.
        // Only show them if:
        // 1. request has 'admin_view=true'
        // 2. AND request has a valid token with role in ['admin', 'waiter', 'kitchen']

        let showHidden = false;
        if (req.query.admin_view === 'true' && req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, JWT_SECRET);
                if (['admin', 'waiter', 'kitchen'].includes(decoded.role)) {
                    showHidden = true;
                }
            } catch (err) {
                console.warn('[BACKEND] Admin view requested but token invalid');
            }
        }

        if (!showHidden) {
            query = query.in('status', ['available', 'sold_out']);
        }

        // Filter by chef recommendation
        if (chef_recommendation === 'true') {
            query = query.eq('is_chef_recommendation', true);
        }

        // Search by name
        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        // Sort logic
        if (sort_by === 'price_asc') {
            query = query.order('price', { ascending: true });
        } else if (sort_by === 'price_desc') {
            query = query.order('price', { ascending: false });
        } else if (sort_by === 'popularity') {
            query = query.order('order_count', { ascending: false });
        } else if (sort_by === 'newest') {
            query = query.order('created_at', { ascending: false });
        } else {
            query = query.order('name', { ascending: true });
        }

        // Apply pagination
        query = query.range(offset, offset + limitNum - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        const totalPages = Math.ceil(count / limitNum);
        const hasMore = offset + limitNum < count;

        const responseData = {
            success: true,
            data: data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: count,
                totalPages: totalPages,
                hasMore: hasMore
            }
        };

        // 5. Save to Redis cache (expires after 1 hour)
        try {
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));
        } catch (e) {
            console.error("Lỗi lưu cache:", e.message);
        }

        res.status(200).json(responseData);

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/menu/items/:id - Get single menu item with modifiers
exports.getMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        // Get menu item
        const { data: item, error: itemError } = await supabase
            .from('menu_items')
            .select('*, category:categories(id, name)')
            .eq('id', id)
            .single();

        if (itemError) throw itemError;
        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Menu item not found'
            });
        }

        // Get linked modifier groups and their options
        const { data: linkedGroups, error: modError } = await supabase
            .from('menu_item_modifier_groups')
            .select(`
                modifier_groups (
                    *,
                    modifiers (*)
                )
            `)
            .eq('menu_item_id', id);

        if (modError) console.error('Error fetching modifiers:', modError);

        // Flatten the data to item.modifier_groups
        item.modifier_groups = (linkedGroups || []).map(lg => lg.modifier_groups);

        res.status(200).json({
            success: true,
            data: item
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
        const { name, description, price, category_id, image_url, images, is_available, is_chef_recommendation, status } = req.body;

        // Basic validation
        if (!name || !price) {
            return res.status(400).json({ success: false, error: 'Name and price are required' });
        }

        // Sync is_available with status for backward compatibility
        let finalStatus = status || 'available';
        let finalAvailability = is_available !== undefined ? is_available : (finalStatus === 'available');

        if (status && is_available === undefined) {
            finalAvailability = (status === 'available');
        } else if (is_available !== undefined && !status) {
            finalStatus = is_available ? 'available' : 'sold_out';
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
                { name, description, price, category_id, image_url, images, is_available: finalAvailability, is_chef_recommendation, status: finalStatus }
            ])
            .select()
            .single();

        if (error) throw error;

        // Invalidate cache
        await clearCache('menu_*');
        await clearCache('cache:/api/menu/*');

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
        const { name, description, price, category_id, image_url, images, is_available, is_chef_recommendation, status } = req.body;

        const updates = {
            name, description, price, category_id, image_url, images, is_available, is_chef_recommendation, status
        };

        // Sync logic for updates
        if (status !== undefined && is_available === undefined) {
            updates.is_available = (status === 'available');
        } else if (is_available !== undefined && status === undefined) {
            updates.status = is_available ? 'available' : 'sold_out';
        }

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

        // Invalidate cache
        await clearCache('menu_*');
        await clearCache('cache:/api/menu/*');

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

        // Invalidate cache
        await clearCache('menu_*');
        await clearCache('cache:/api/menu/*');

        res.status(200).json({
            success: true,
            message: 'Menu item deleted successfully'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
