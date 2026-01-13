const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
    console.warn('Redis Client Error:', err.message);
    console.warn('Proceeding without Redis (Fallback to DB)');
});

redisClient.on('connect', () => {
    console.log('Redis Client Connected');
});

(async () => {
    if (process.env.NODE_ENV !== 'test') {
        try {
            await redisClient.connect();
        } catch (err) {
            console.warn('Failed to connect to Redis:', err.message);
        }
    }
})();

module.exports = redisClient;
