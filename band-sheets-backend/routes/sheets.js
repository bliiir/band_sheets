const express = require('express');
const {
  getSheets,
  getSheet,
  createSheet,
  updateSheet,
  deleteSheet,
  shareSheet
} = require('../controllers/sheetController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .get(optionalAuth, getSheets)
  .post(protect, createSheet);

router
  .route('/:id')
  .get(optionalAuth, getSheet)
  .put(protect, updateSheet)
  .delete(protect, deleteSheet);

router.route('/:id/share').post(protect, shareSheet);

module.exports = router;
