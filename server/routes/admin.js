const express = require('express');
const router  = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

router.use(protect, restrictTo('admin'));

router.get('/stats',               ctrl.getStats);
router.get('/users',               ctrl.getUsers);
router.put('/users/:id/role',      ctrl.updateUserRole);
router.put('/users/:id/status',    ctrl.toggleUserStatus);
router.delete('/users/:id',        ctrl.deleteUser);

module.exports = router;
