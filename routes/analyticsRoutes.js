const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { isAuthenticated } = require('./middleware/authMiddleware');

router.get('/', isAuthenticated, analyticsController.getAdvancedAnalytics);
router.get('/ratios', isAuthenticated, analyticsController.getAllCompaniesRatios);
router.get('/chart-data', isAuthenticated, analyticsController.getRatioChartData);

module.exports = router;