const supabase = require('../config/supabaseClient');

// GET /api/search - Fuzzy search for menu items
exports.fuzzySearch = async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;

        // Validation
        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự'
            });
        }

        const searchTerm = q.trim();

        // Use fuzzy search function from database
        const { data, error } = await supabase
            .rpc('fuzzy_search_menu_items', {
                search_term: searchTerm,
                match_limit: parseInt(limit)
            });

        if (error) throw error;

        // Extra safety check: filter out hidden items if they somehow leaked through the RPC
        const filteredData = (data || []).filter(item =>
            item.status === 'available' || item.status === 'sold_out' ||
            (item.status === undefined && item.is_available) // fallback for old data/RPC
        );

        res.status(200).json({
            success: true,
            data: filteredData,
            query: searchTerm
        });

    } catch (err) {
        console.error('Fuzzy Search Error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi tìm kiếm',
            error: err.message
        });
    }
};
