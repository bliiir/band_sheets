const express = require('express');
const {
  getSheets,
  getSheet,
  createSheet,
  updateSheet,
  deleteSheet,
  shareSheet
} = require('../controllers/sheetController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router
  .route('/')
  .get(getSheets)
  .post(createSheet);

router
  .route('/:id')
  .get(getSheet)
  .put(updateSheet)
  .delete(deleteSheet);

router.route('/:id/share').post(shareSheet);

module.exports = router;
