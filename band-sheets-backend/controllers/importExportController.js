const Sheet = require('../models/sheet');

// Export all sheets for the current user
exports.exportSheets = async (req, res) => {
  try {
    // Find all sheets owned by the user
    const sheets = await Sheet.find({ owner: req.user.id });
    
    if (!sheets || sheets.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No sheets found for export'
      });
    }
    
    // Create export object with metadata
    const exportData = {
      exportDate: new Date(),
      exportedBy: req.user.id,
      sheetsCount: sheets.length,
      sheets: sheets
    };
    
    res.status(200).json({
      success: true,
      data: exportData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Import sheets from exported JSON
exports.importSheets = async (req, res) => {
  try {
    const { sheets, importOptions } = req.body;
    console.log('Import options received:', importOptions);
    
    if (!sheets || !Array.isArray(sheets) || sheets.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid import data. No sheets found in the import file.'
      });
    }
    
    // Set default options if not provided
    const options = {
      generateNewIds: importOptions?.generateNewIds || false,
      skipDuplicates: importOptions?.skipDuplicates || false,
      overwriteDuplicates: importOptions?.overwriteDuplicates || false
    };
    
    console.log('Using import options:', options);
    
    const results = {
      total: sheets.length,
      imported: 0,
      skipped: 0,
      errors: []
    };
    
    // Process each sheet
    for (const sheetData of sheets) {
      try {
        // Check if sheet with this ID already exists
        const existingSheet = await Sheet.findOne({ id: sheetData.id });
        
        if (existingSheet) {
          // Handle based on options
          if (options.generateNewIds) {
            // Generate a new ID for this sheet
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000000);
            sheetData.id = `${timestamp}_${random}`;
            console.log(`Generated new ID for duplicate sheet: ${sheetData.id}`);
            // Continue with import using new ID
          } else if (options.skipDuplicates) {
            // Skip this sheet
            console.log(`Skipping duplicate sheet with ID: ${sheetData.id}`);
            results.skipped++;
            continue;
          } else if (options.overwriteDuplicates) {
            // Update existing sheet
            console.log(`Overwriting existing sheet with ID: ${sheetData.id}`);
            await Sheet.findOneAndUpdate({ id: sheetData.id }, {
              ...sheetData,
              owner: req.user.id,
              sharedWith: existingSheet.sharedWith || [],
              isPublic: existingSheet.isPublic || false,
              updatedAt: new Date()
            });
            results.imported++;
            continue;
          } else {
            // Default to skip
            console.log(`No option specified, skipping sheet with ID: ${sheetData.id}`);
            results.skipped++;
            continue;
          }
        }
        
        // Prepare sheet data for import
        const newSheetData = {
          ...sheetData,
          owner: req.user.id, // Set current user as owner
          sharedWith: [], // Reset sharing
          isPublic: false, // Reset public status
          dateImported: new Date()
        };
        
        // Create new sheet
        await Sheet.create(newSheetData);
        results.imported++;
      } catch (err) {
        results.errors.push({
          sheetId: sheetData.id || 'unknown',
          title: sheetData.title || 'unknown',
          error: err.message
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Import complete. ${results.imported} sheets imported, ${results.skipped} skipped.`,
      results
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
