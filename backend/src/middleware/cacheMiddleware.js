const redisClient = require('../config/redisClient');

const cacheMiddleware = (duration = 3600) => {
    return async (req, res, next) => {
        if (!redisClient.isOpen) {
            console.warn('⚠️ Redis not open, skipping cache check.');
            return next();
        }

        const key = `cache:${req.originalUrl || req.url}`;

        try {
            const cachedData = await redisClient.get(key);
            if (cachedData) {
                console.log(`Cache Hit: ${key}`);
                return res.status(200).json(JSON.parse(cachedData));
            } else {
                console.log(`❌ Cache Miss: ${key}`);
            }

            // Patch res.json to store the response in cache
            const originalJson = res.json;
            res.json = function (body) {
                if (res.statusCode === 200 && body.success) {
                    redisClient.setEx(key, duration, JSON.stringify(body))
                        .then(() => console.log(`💾 Cached Saved: ${key}`))
                        .catch(err => console.error('Redis Set Error:', err));
                }
                return originalJson.call(this, body);
            };

            next();
        } catch (err) {
            console.error('Cache Middleware Error:', err);
            next();
        }
    };
};

const clearCache = async (pattern) => {
    if (!redisClient.isOpen) return;

    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`🧹 Cleared cache for pattern: ${pattern} (${keys.length} keys)`);
        }
    } catch (err) {
        console.error('Clear Cache Error:', err);
    }
};

module.exports = { cacheMiddleware, clearCache };
