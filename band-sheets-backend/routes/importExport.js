const express = require('express');
const {
  exportSheets,
  importSheets
} = require('../controllers/importExportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Export and import routes
router.route('/export').get(exportSheets);
router.route('/import').post(importSheets);

module.exports = router;
