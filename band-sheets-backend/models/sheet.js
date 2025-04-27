const mongoose = require('mongoose');

// Part Schema (for sections)
const partSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.Mixed, required: true },
  part: String,
  bars: Number,
  notes: String,
  lyrics: String
}, { _id: false });

// Section Schema
const sectionSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.Mixed, required: true },
  name: String,
  energy: Number,
  backgroundColor: String,
  parts: [partSchema]
}, { _id: false });

// Parts Module Schema
const partsModuleSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.Mixed, required: true },
  part: String,
  bars: Number,
  chords: String
}, { _id: false });

// Sheet Schema
const sheetSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  artist: String,
  bpm: Number,
  dateCreated: Date,
  dateModified: Date,
  sections: [sectionSchema],
  partsModule: [partsModuleSchema],
  transposeValue: {
    type: Number,
    default: 0
  },
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
    default: true  // Changed to true to make sheets publicly readable by default
  }
}, { timestamps: true });

const Sheet = mongoose.model('Sheet', sheetSchema);
module.exports = Sheet;
