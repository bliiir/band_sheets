const mongoose = require('mongoose');

// Sheet Reference Schema (for setlists) - simplified to just store IDs
const sheetReferenceSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true 
  }
}, { _id: false });

// Setlist Schema
const setlistSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  sheets: [sheetReferenceSchema],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['read', 'edit'],
      default: 'read'
    }
  }],
  isPublic: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Setlist = mongoose.model('Setlist', setlistSchema);
module.exports = Setlist;
