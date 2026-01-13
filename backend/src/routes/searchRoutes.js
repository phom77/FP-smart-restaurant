const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Fuzzy search for menu items
router.get('/', searchController.fuzzySearch);

module.exports = router;
