const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379' // Tên service trong docker-compose
});

client.on('error', (err) => console.log('Redis Client Error', err));
client.on('connect', () => console.log('✅ Redis Connected'));

(async () => {
  try {
    await client.connect();
  } catch (err) {
    console.log('Redis Connection Failed (Fallback mode enabled)');
  }
})();

module.exports = client;