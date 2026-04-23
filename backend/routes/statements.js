const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/statementController');

router.use(protect);
router.get('/export/pdf', ctrl.exportPDF);
router.get('/export/csv', ctrl.exportCSV);
router.get('/',           ctrl.getStatements);
router.get('/:id',        ctrl.getStatement);
router.post('/upload',    ctrl.upload.single('file'), ctrl.uploadStatement);

module.exports = router;
