const express = require('express');
const {
  getSetlists,
  getSetlist,
  createSetlist,
  updateSetlist,
  deleteSetlist,
  addSheetToSetlist,
  removeSheetFromSetlist,
  reorderSetlistSheets,
  favoriteSetlist
} = require('../controllers/setlistController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Base setlist routes
router
  .route('/')
  .get(optionalAuth, getSetlists)
  .post(protect, createSetlist);

router
  .route('/:id')
  .get(optionalAuth, getSetlist)
  .put(protect, updateSetlist)
  .delete(protect, deleteSetlist);

// Sheet management within setlists
router
  .route('/:id/sheets')
  .post(protect, addSheetToSetlist);

router
  .route('/:id/sheets/:sheetId')
  .delete(protect, removeSheetFromSetlist);

// Reordering sheets within a setlist
router
  .route('/:id/reorder')
  .put(protect, reorderSetlistSheets);

// Favorite a setlist (create a copy for the current user)
router
  .route('/:id/favorite')
  .post(protect, favoriteSetlist);

module.exports = router;
