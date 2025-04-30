const Setlist = require('../models/setlist');
const Sheet = require('../models/sheet');
const mongoose = require('mongoose');

/**
 * Get all setlists for the current user
 * @route GET /api/setlists
 * @access Private (or Public for shared setlists)
 */
exports.getSetlists = async (req, res) => {
  try {
    let query = {};
    
    if (req.user) {
      // If authenticated, show only owned and shared setlists (not all public ones)
      query = {
        $or: [
          { owner: req.user.id },
          { 'sharedWith.user': req.user.id }
          // Removed isPublic: true to prevent seeing others' public setlists
        ]
      };
    } else {
      // If not authenticated, return empty array instead of public setlists
      return res.status(200).json({
        success: true,
        count: 0,
        setlists: []
      });
    }
    
    const setlists = await Setlist.find(query)
      .sort({ updatedAt: -1 })
      .populate('owner', 'name email');
    
    res.status(200).json({
      success: true,
      count: setlists.length,
      setlists
    });
  } catch (error) {
    console.error('Error fetching setlists:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Get a single setlist by ID
 * @route GET /api/setlists/:id
 * @access Private (or Public for shared setlists)
 */
exports.getSetlist = async (req, res) => {
  try {
    const setlist = await Setlist.findOne({ id: req.params.id })
      .populate('owner', 'name email')
      .populate('sharedWith.user', 'name email');
    
    if (!setlist) {
      return res.status(404).json({
        success: false,
        error: 'Setlist not found'
      });
    }
    
    // Check if user has access to this setlist
    const hasAccess = 
      setlist.isPublic || 
      (req.user && (
        setlist.owner.equals(req.user.id) || 
        setlist.sharedWith.some(share => share.user.equals(req.user.id))
      ));
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this setlist'
      });
    }
    
    res.status(200).json({
      success: true,
      setlist
    });
  } catch (error) {
    console.error('Error fetching setlist:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Create a new setlist
 * @route POST /api/setlists
 * @access Private
 */
exports.createSetlist = async (req, res) => {
  try {
    console.log('Creating setlist, request body:', req.body);
    console.log('User authenticated?', !!req.user);
    
    const { id, name, description, sheets } = req.body;
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to create setlists'
      });
    }
    
    // Create the setlist
    const setlistData = {
      id: id || `setlist_${Date.now()}`,
      name,
      description,
      sheets: sheets || [],
      owner: req.user.id
    };
    
    console.log('Creating setlist with data:', setlistData);
    
    const setlist = await Setlist.create(setlistData);
    console.log('Setlist created successfully:', setlist);
    
    res.status(201).json({
      success: true,
      setlist
    });
  } catch (error) {
    console.error('Error creating setlist:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'A setlist with this ID already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Update a setlist
 * @route PUT /api/setlists/:id
 * @access Private
 */
exports.updateSetlist = async (req, res) => {
  try {
    let setlist = await Setlist.findOne({ id: req.params.id });
    
    if (!setlist) {
      return res.status(404).json({
        success: false,
        error: 'Setlist not found'
      });
    }
    
    // Check ownership or edit permission
    const hasEditAccess = 
      setlist.owner.equals(req.user.id) || 
      setlist.sharedWith.some(share => 
        share.user.equals(req.user.id) && share.permission === 'edit'
      );
    
    if (!hasEditAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this setlist'
      });
    }
    
    // Update the setlist
    setlist = await Setlist.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      setlist
    });
  } catch (error) {
    console.error('Error updating setlist:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Delete a setlist
 * @route DELETE /api/setlists/:id
 * @access Private
 */
exports.deleteSetlist = async (req, res) => {
  try {
    const setlist = await Setlist.findOne({ id: req.params.id });
    
    if (!setlist) {
      return res.status(404).json({
        success: false,
        error: 'Setlist not found'
      });
    }
    
    // Check ownership (only owner can delete)
    if (!setlist.owner.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this setlist'
      });
    }
    
    // Use deleteOne instead of remove() which is deprecated
    await Setlist.deleteOne({ _id: setlist._id });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting setlist:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Add a sheet to a setlist
 * @route POST /api/setlists/:id/sheets
 * @access Private
 */
exports.addSheetToSetlist = async (req, res) => {
  try {
    const { sheetId } = req.body;
    
    if (!sheetId) {
      return res.status(400).json({
        success: false,
        error: 'Sheet ID is required'
      });
    }
    
    let setlist = await Setlist.findOne({ id: req.params.id });
    
    if (!setlist) {
      return res.status(404).json({
        success: false,
        error: 'Setlist not found'
      });
    }
    
    // Check ownership or edit permission
    const hasEditAccess = 
      setlist.owner.equals(req.user.id) || 
      setlist.sharedWith.some(share => 
        share.user.equals(req.user.id) && share.permission === 'edit'
      );
    
    if (!hasEditAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this setlist'
      });
    }
    
    // Check if sheet already exists in setlist
    const sheetExists = setlist.sheets.some(sheet => sheet.id === sheetId);
    
    if (sheetExists) {
      return res.status(400).json({
        success: false,
        error: 'Sheet already exists in this setlist'
      });
    }
    
    // Get sheet details
    const sheet = await Sheet.findOne({ id: sheetId });
    
    if (!sheet) {
      return res.status(404).json({
        success: false,
        error: 'Sheet not found'
      });
    }
    
    // Add sheet to setlist
    setlist = await Setlist.findOneAndUpdate(
      { id: req.params.id },
      { 
        $push: { 
          sheets: {
            id: sheet.id,
            title: sheet.title,
            artist: sheet.artist,
            bpm: sheet.bpm
          } 
        } 
      },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      setlist
    });
  } catch (error) {
    console.error('Error adding sheet to setlist:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Remove a sheet from a setlist
 * @route DELETE /api/setlists/:id/sheets/:sheetId
 * @access Private
 */
exports.removeSheetFromSetlist = async (req, res) => {
  try {
    let setlist = await Setlist.findOne({ id: req.params.id });
    
    if (!setlist) {
      return res.status(404).json({
        success: false,
        error: 'Setlist not found'
      });
    }
    
    // Check ownership or edit permission
    const hasEditAccess = 
      setlist.owner.equals(req.user.id) || 
      setlist.sharedWith.some(share => 
        share.user.equals(req.user.id) && share.permission === 'edit'
      );
    
    if (!hasEditAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this setlist'
      });
    }
    
    // Remove sheet from setlist
    setlist = await Setlist.findOneAndUpdate(
      { id: req.params.id },
      { $pull: { sheets: { id: req.params.sheetId } } },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      setlist
    });
  } catch (error) {
    console.error('Error removing sheet from setlist:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * Reorder sheets in a setlist
 * @route PUT /api/setlists/:id/reorder
 * @access Private
 */
exports.reorderSetlistSheets = async (req, res) => {
  try {
    const { oldIndex, newIndex } = req.body;
    
    if (oldIndex === undefined || newIndex === undefined) {
      return res.status(400).json({
        success: false,
        error: 'oldIndex and newIndex are required'
      });
    }
    
    let setlist = await Setlist.findOne({ id: req.params.id });
    
    if (!setlist) {
      return res.status(404).json({
        success: false,
        error: 'Setlist not found'
      });
    }
    
    // Check ownership or edit permission
    const hasEditAccess = 
      setlist.owner.equals(req.user.id) || 
      setlist.sharedWith.some(share => 
        share.user.equals(req.user.id) && share.permission === 'edit'
      );
    
    if (!hasEditAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this setlist'
      });
    }
    
    // Reorder sheets
    const sheets = [...setlist.sheets];
    const [removed] = sheets.splice(oldIndex, 1);
    sheets.splice(newIndex, 0, removed);
    
    // Update setlist with new order
    setlist = await Setlist.findOneAndUpdate(
      { id: req.params.id },
      { $set: { sheets } },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      setlist
    });
  } catch (error) {
    console.error('Error reordering setlist sheets:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};
