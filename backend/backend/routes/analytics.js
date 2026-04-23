const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/analyticsController');

router.use(protect);
router.get('/summary',        ctrl.getSummary);
router.get('/by-category',    ctrl.getByCategory);
router.get('/monthly-trend',  ctrl.getMonthlyTrend);
router.get('/recent',         ctrl.getRecentTransactions);

module.exports = router;
