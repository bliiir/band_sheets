const Sheet = require('../models/sheet');
const User = require('../models/user');
const mongoose = require('mongoose');

// Get all sheets for the current user
exports.getSheets = async (req, res) => {
  try {
    // Find sheets owned by the user or shared with them
    const sheets = await Sheet.find({
      $or: [
        { owner: req.user.id },
        { 'sharedWith.user': req.user.id },
        { isPublic: true }
      ]
    }).select('id title artist dateModified');
    
    res.status(200).json({
      success: true,
      count: sheets.length,
      data: sheets
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get single sheet
exports.getSheet = async (req, res) => {
  try {
    const sheet = await Sheet.findOne({ id: req.params.id });
    
    if (!sheet) {
      return res.status(404).json({
        success: false,
        error: 'Sheet not found'
      });
    }
    
    // Check if user has access to this sheet
    if (
      sheet.owner.toString() !== req.user.id && 
      !sheet.sharedWith.some(s => s.user.toString() === req.user.id) &&
      !sheet.isPublic
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this sheet'
      });
    }
    
    res.status(200).json({
      success: true,
      data: sheet
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Create sheet
exports.createSheet = async (req, res) => {
  try {
    // Add owner to the sheet
    req.body.owner = req.user.id;
    
    const sheet = await Sheet.create(req.body);
    
    res.status(201).json({
      success: true,
      data: sheet
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update sheet
exports.updateSheet = async (req, res) => {
  try {
    let sheet = await Sheet.findOne({ id: req.params.id });
    
    if (!sheet) {
      return res.status(404).json({
        success: false,
        error: 'Sheet not found'
      });
    }
    
    // Check if user is owner or has edit permission
    if (
      sheet.owner.toString() !== req.user.id && 
      !sheet.sharedWith.some(s => 
        s.user.toString() === req.user.id && s.permission === 'edit'
      )
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this sheet'
      });
    }
    
    // Update the sheet
    sheet = await Sheet.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: sheet
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete sheet
exports.deleteSheet = async (req, res) => {
  try {
    const sheet = await Sheet.findOne({ id: req.params.id });
    
    if (!sheet) {
      return res.status(404).json({
        success: false,
        error: 'Sheet not found'
      });
    }
    
    // Only owner can delete sheet
    if (sheet.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this sheet'
      });
    }
    
    await Sheet.findOneAndDelete({ id: req.params.id });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Share sheet with another user
exports.shareSheet = async (req, res) => {
  try {
    const { username, permission } = req.body;
    
    // Find the sheet
    const sheet = await Sheet.findOne({ id: req.params.id });
    
    if (!sheet) {
      return res.status(404).json({
        success: false,
        error: 'Sheet not found'
      });
    }
    
    // Only owner can share sheet
    if (sheet.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to share this sheet'
      });
    }
    
    // Find user to share with
    const userToShare = await User.findOne({ username });
    
    if (!userToShare) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if already shared
    if (sheet.sharedWith.some(s => s.user.toString() === userToShare._id.toString())) {
      // Update permission if already shared
      sheet.sharedWith = sheet.sharedWith.map(s => {
        if (s.user.toString() === userToShare._id.toString()) {
          return { user: userToShare._id, permission };
        }
        return s;
      });
    } else {
      // Add to shared users
      sheet.sharedWith.push({
        user: userToShare._id,
        permission
      });
    }
    
    await sheet.save();
    
    res.status(200).json({
      success: true,
      data: sheet
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
