const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/transactionController');

router.use(protect);

router.get('/',    ctrl.getTransactions);
router.post('/',   ctrl.createTransaction);
router.delete('/bulk', ctrl.deleteAll);
router.get('/:id',    ctrl.getTransaction);
router.put('/:id',    ctrl.updateTransaction);
router.delete('/:id', ctrl.deleteTransaction);

module.exports = router;
