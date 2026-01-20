require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const passport = require('passport');
const { initSocket } = require('./config/socket');

// Initialize Passport configuration
require('./config/passportConfig');

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
const paymentRoutes = require('./routes/paymentRoutes');
const path = require('path');
const testEmailRouter = require('./routes/testEmail');

initSocket(server);

const allowedOrigins = [
  "http://localhost:5173", 
  process.env.FRONTEND_URL 
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin); 
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(passport.initialize());

// Serve static files from uploads directory


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/revenue', require('./routes/revenueRoutes')); // Keep for backward compatibility or remove if preferred
app.use('/api/admin/tables', tableRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/system', require('./routes/systemRoutes'));
app.use('/api/super-admin', require('./routes/superAdminRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));

app.use('/api', testEmailRouter);

app.get('/', (req, res) => {
  res.send('Hello from Smart Restaurant Backend (Running on Docker WSL)!');
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
