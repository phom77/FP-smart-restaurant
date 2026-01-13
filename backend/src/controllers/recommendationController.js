const supabase = require('../config/supabaseClient');

// GET /api/menu-items/:id/recommendations - Get recommended items
exports.getRecommendations = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 5 } = req.query;

        // Get current item's category
        const { data: currentItem, error: itemError } = await supabase
            .from('menu_items')
            .select('category_id, name')
            .eq('id', id)
            .single();

        if (itemError) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy món ăn'
            });
        }

        // Strategy 1: Items frequently ordered together (collaborative filtering)
        const { data: frequentPairs, error: pairError } = await supabase
            .rpc('get_frequently_ordered_together', {
                item_id: id,
                match_limit: parseInt(limit)
            });

        if (pairError) {
            console.error('Frequent pairs error:', pairError);
        }

        // Strategy 2: Same category items with high ratings
        const { data: sameCategoryItems, error: categoryError } = await supabase
            .from('menu_items')
            .select('id, name, price, image_url, avg_rating, review_count, category_id')
            .eq('category_id', currentItem.category_id)
            .eq('is_available', true)
            .neq('id', id)
            .order('avg_rating', { ascending: false })
            .order('review_count', { ascending: false })
            .limit(parseInt(limit));

        if (categoryError) throw categoryError;

        // Combine strategies and deduplicate
        const seenIds = new Set();
        const recommendations = [];

        // Prioritize frequently ordered together
        if (frequentPairs && frequentPairs.length > 0) {
            frequentPairs.forEach(item => {
                if (!seenIds.has(item.id) && recommendations.length < parseInt(limit)) {
                    seenIds.add(item.id);
                    recommendations.push({
                        ...item,
                        recommendation_reason: 'frequently_ordered_together'
                    });
                }
            });
        }

        // Fill remaining slots with same category items
        if (sameCategoryItems && sameCategoryItems.length > 0) {
            sameCategoryItems.forEach(item => {
                if (!seenIds.has(item.id) && recommendations.length < parseInt(limit)) {
                    seenIds.add(item.id);
                    recommendations.push({
                        ...item,
                        recommendation_reason: 'same_category'
                    });
                }
            });
        }

        res.status(200).json({
            success: true,
            data: recommendations,
            total: recommendations.length
        });

    } catch (err) {
        console.error('Get Recommendations Error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy gợi ý món ăn',
            error: err.message
        });
    }
};
