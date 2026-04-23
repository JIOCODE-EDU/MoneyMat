// ── routes/auth.js ──
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

router.post('/register',        ctrl.register);
router.post('/login',           ctrl.login);
router.post('/refresh',         ctrl.refreshToken);
router.post('/logout',          protect, ctrl.logout);
router.get('/me',               protect, ctrl.getMe);
router.put('/change-password',  protect, ctrl.changePassword);

module.exports = router;
