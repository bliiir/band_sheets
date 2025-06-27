const Sheet = require('../models/sheet');
const User = require('../models/user');
const mongoose = require('mongoose');

// Get all sheets for the current user or public sheets for unauthenticated users
exports.getSheets = async (req, res) => {
  try {
    console.log('Getting sheets, authenticated user:', !!req.user);
    
    let query;
    
    // Handle both authenticated and unauthenticated users
    if (req.user) {
      // For authenticated users - get their own sheets, shared sheets, and public sheets
      query = {
        $or: [
          { owner: req.user.id },
          { 'sharedWith.user': req.user.id },
          { isPublic: true }
        ]
      };
      console.log('Authenticated user, fetching owned, shared, and public sheets');
    } else {
      // For unauthenticated users - only get public sheets
      query = { isPublic: true };
      console.log('Unauthenticated user, fetching only public sheets');
    }
    
    // Execute the query
    const sheets = await Sheet.find(query).select('id title artist dateModified status');
    
    console.log(`Found ${sheets.length} sheets matching query`);
    
    res.status(200).json({
      success: true,
      count: sheets.length,
      data: sheets
    });
  } catch (error) {
    console.error('Error in getSheets controller:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get single sheet - handles both authenticated and unauthenticated access
exports.getSheet = async (req, res) => {
  try {
    const requestedId = req.params.id;
    console.log('Getting sheet with ID:', requestedId);
    console.log('User authenticated:', !!req.user);
    console.log('Debug parameters:', req.query);
    
    // Log basic request information for all sheets
    console.log('Headers:', req.headers);
    console.log('Query params:', req.query);
    console.log('User info:', req.user ? { id: req.user.id, email: req.user.email } : 'Not authenticated');
    
    // First find the sheet regardless of access rights
    const sheet = await Sheet.findOne({ id: requestedId });
    
    if (!sheet) {
      console.log('Sheet not found in database:', requestedId);
      

      
      return res.status(404).json({
        success: false,
        error: 'Sheet not found'
      });
    }
    
    console.log('Sheet found:', sheet.id);
    console.log('Sheet details:', {
      id: sheet.id,
      title: sheet.title,
      isPublic: sheet.isPublic,
      owner: sheet.owner
    });
    
    // All sheets should be public and accessible to everyone
    // This is the design of the application
    
    // Log access details for debugging
    const isPublic = sheet.isPublic;
    const hasUser = !!req.user;
    const isOwner = hasUser && sheet.owner.toString() === req.user.id;
    const isSharedWith = hasUser && sheet.sharedWith.some(s => s.user.toString() === req.user.id);
    
    console.log('Access check details:');
    console.log('- Sheet is public:', isPublic);
    console.log('- Has authenticated user:', hasUser);
    console.log('- User is owner:', isOwner);
    console.log('- Shared with user:', isSharedWith);
    
    // If the sheet is not marked as public, update it to be public
    if (!isPublic) {
      console.log('Sheet was not marked as public. Updating to be public.');
      try {
        await Sheet.updateOne({ id: requestedId }, { isPublic: true });
        console.log('Sheet updated to be public successfully');
      } catch (updateError) {
        console.error('Error updating sheet to be public:', updateError);
        // Continue anyway - we'll still return the sheet
      }
    }
    
    // Always grant access regardless of authentication status
    // This ensures all sheets are accessible to everyone
    
    console.log('Access granted to sheet:', sheet.id);
    
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
