const express = require('express');
const router = express.Router();
const comparisonController = require('../controllers/comparisonController');
const { isAuthenticated } = require('./middleware/authMiddleware');

router.get('/', isAuthenticated, comparisonController.getComparisonPage);
router.get('/search', isAuthenticated, comparisonController.searchCompanies);
router.get('/table', isAuthenticated, comparisonController.getComparisonTableView);
router.post('/compare', isAuthenticated, comparisonController.compareCompanies);

module.exports = router;