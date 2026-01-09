const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5001;
const categoryRoutes = require('./routes/categoryRoutes');
const menuRoutes = require('./routes/menuRoutes');

app.use(cors());
app.use(express.json());


// Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/menu', menuRoutes);

app.get('/', (req, res) => {
  res.send('Hello from Smart Restaurant Backend (Running on Docker WSL)!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});