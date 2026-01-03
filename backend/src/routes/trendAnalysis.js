const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const trendController = require('../controllers/trendController');

// Get trend analysis and disease prediction
router.get('/', auth, trendController.getTrendAnalysis);

module.exports = router;
