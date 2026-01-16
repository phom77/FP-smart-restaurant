// backend/src/controllers/systemController.js
const supabase = require('../config/supabaseClient');
const redisClient = require('../config/redisClient');

// Helper: Xóa cache của system settings
const clearSystemCache = async () => {
    if (redisClient.isOpen) {
        await redisClient.del('system_settings');
        console.log('🧹 System Settings Cache Cleared');
    }
};

// 1. GET /api/system/settings - Public (Ai cũng xem được)
exports.getSettings = async (req, res) => {
    try {
        const cacheKey = 'system_settings';
        
        // --- 1. Check Redis Cache ---
        if (redisClient.isOpen) {
            try {
                const cached = await redisClient.get(cacheKey);
                if (cached) {
                    console.log('⚡ Cache Hit: System Settings');
                    return res.status(200).json({ 
                        success: true, 
                        data: JSON.parse(cached) 
                    });
                }
            } catch (redisErr) {
                console.warn('Redis Get Error (Skipping):', redisErr.message);
            }
        }

        // --- 2. Query Database ---
        const { data, error } = await supabase
            .from('system_settings')
            .select('*');

        if (error) throw error;

        // Chuyển đổi mảng Key-Value thành Object cho Frontend dễ dùng
        // VD: [{key: 'vat', value: '8'}] -> { vat: '8' }
        const settingsObject = {};
        if (data) {
            data.forEach(item => {
                settingsObject[item.key] = item.value;
            });
        }

        // --- 3. Save Cache (TTL: 24h) ---
        if (redisClient.isOpen) {
            try {
                // Cache 1 ngày vì cấu hình rất ít thay đổi
                await redisClient.setEx(cacheKey, 86400, JSON.stringify(settingsObject));
            } catch (redisErr) {
                console.warn('Redis Set Error:', redisErr.message);
            }
        }

        res.status(200).json({ 
            success: true, 
            data: settingsObject 
        });

    } catch (err) {
        console.error('Get Settings Error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

// 2. PUT /api/system/settings - Admin Only
exports.updateSettings = async (req, res) => {
    try {
        const updates = req.body; // VD: { restaurant_name: "Tên Mới", vat_rate: "10" }
        const keys = Object.keys(updates);

        if (keys.length === 0) {
            return res.status(400).json({ success: false, error: "No settings provided" });
        }

        // Chạy vòng lặp update từng key (Dùng Upsert để tạo mới nếu chưa có)
        const updatePromises = keys.map(key => 
            supabase
                .from('system_settings')
                .upsert({ 
                    key: key, 
                    value: String(updates[key]), // Ép kiểu thành string để lưu
                    updated_at: new Date()
                })
        );

        await Promise.all(updatePromises);

        // --- Quan trọng: Xóa cache cũ ngay lập tức ---
        await clearSystemCache();

        res.status(200).json({ 
            success: true, 
            message: "Settings updated successfully" 
        });

    } catch (err) {
        console.error('Update Settings Error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};