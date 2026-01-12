require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { initSocket } = require('./config/socket');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5001;
const categoryRoutes = require('./routes/categoryRoutes');
const menuRoutes = require('./routes/menuRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const kitchenRoutes = require('./routes/kitchenRoutes');
const tableRoutes = require('./routes/tableRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const searchRoutes = require('./routes/searchRoutes');
const path = require('path');

initSocket(server);

app.use(cors({
  origin: true, // Cho phép mọi origin phản hồi lại
  credentials: true // Cho phép gửi cookie/token nếu cần
}));
app.use(express.json());

// Serve static files from uploads directory


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/revenue', require('./routes/revenueRoutes')); // Keep for backward compatibility or remove if preferred
app.use('/api/tables', tableRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/search', searchRoutes);

app.get('/', (req, res) => {
  res.send('Hello from Smart Restaurant Backend (Running on Docker WSL)!');
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});