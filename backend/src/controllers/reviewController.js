const supabase = require('../config/supabaseClient');

// POST /api/reviews - Create a new review
exports.createReview = async (req, res) => {
    try {
        const { menu_item_id, rating, comment } = req.body;
        const user_id = req.user?.id; // From JWT middleware

        // 1. Validation - Rating must be 1-5
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating phải từ 1 đến 5 sao'
            });
        }

        if (!menu_item_id) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin món ăn'
            });
        }

        // 2. CRITICAL: Check if user has purchased this item
        // User must have completed order with this item
        const { data: orderCheck, error: orderError } = await supabase
            .from('order_items')
            .select(`
        id,
        order:orders!inner(
          id,
          customer_id,
          status
        )
      `)
            .eq('menu_item_id', menu_item_id)
            .eq('order.customer_id', user_id)
            .eq('order.status', 'completed')
            .limit(1);

        if (orderError) throw orderError;

        if (!orderCheck || orderCheck.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chỉ có thể đánh giá món đã mua và hoàn thành thanh toán'
            });
        }

        // 3. Check for duplicate review (user can only review once per item)
        const { data: existingReview } = await supabase
            .from('reviews')
            .select('id')
            .eq('user_id', user_id)
            .eq('menu_item_id', menu_item_id)
            .single();

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã đánh giá món này rồi'
            });
        }

        // 4. Create review
        const { data: review, error: reviewError } = await supabase
            .from('reviews')
            .insert([{
                user_id,
                menu_item_id,
                rating,
                comment: comment?.trim() || null
            }])
            .select(`
        id,
        rating,
        comment,
        created_at,
        user:users(id, full_name)
      `)
            .single();

        if (reviewError) throw reviewError;

        // Trigger will automatically update avg_rating in menu_items

        res.status(201).json({
            success: true,
            message: 'Đánh giá thành công',
            data: review
        });

    } catch (err) {
        console.error('Create Review Error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo đánh giá',
            error: err.message
        });
    }
};

// GET /api/menu-items/:id/reviews - Get all reviews for a menu item
exports.getItemReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10, sort = 'newest' } = req.query;
        const offset = (page - 1) * limit;

        // Determine sort order
        let orderBy = 'created_at';
        let ascending = false;

        if (sort === 'oldest') {
            ascending = true;
        } else if (sort === 'highest') {
            orderBy = 'rating';
            ascending = false;
        } else if (sort === 'lowest') {
            orderBy = 'rating';
            ascending = true;
        }

        const { data, error, count } = await supabase
            .from('reviews')
            .select(`
        id,
        rating,
        comment,
        created_at,
        user:users(id, full_name)
      `, { count: 'exact' })
            .eq('menu_item_id', id)
            .order(orderBy, { ascending })
            .range(offset, offset + parseInt(limit) - 1);

        if (error) throw error;

        res.status(200).json({
            success: true,
            data: data || [],
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (err) {
        console.error('Get Reviews Error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách đánh giá',
            error: err.message
        });
    }
};

// GET /api/reviews/my-reviews - Get current user's reviews
exports.getMyReviews = async (req, res) => {
    try {
        const user_id = req.user?.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const { data, error, count } = await supabase
            .from('reviews')
            .select(`
        id,
        rating,
        comment,
        created_at,
        menu_item:menu_items(id, name, image_url)
      `, { count: 'exact' })
            .eq('user_id', user_id)
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (error) throw error;

        res.status(200).json({
            success: true,
            data: data || [],
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (err) {
        console.error('Get My Reviews Error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách đánh giá của bạn',
            error: err.message
        });
    }
};

// DELETE /api/reviews/:id - Delete a review (user can delete their own review)
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user?.id;

        // Check if review belongs to user
        const { data: review, error: fetchError } = await supabase
            .from('reviews')
            .select('user_id')
            .eq('id', id)
            .single();

        if (fetchError || !review) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        if (review.user_id !== user_id) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa đánh giá này'
            });
        }

        // Delete review
        const { error: deleteError } = await supabase
            .from('reviews')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        // Trigger will automatically update avg_rating

        res.status(200).json({
            success: true,
            message: 'Xóa đánh giá thành công'
        });

    } catch (err) {
        console.error('Delete Review Error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi xóa đánh giá',
            error: err.message
        });
    }
};
