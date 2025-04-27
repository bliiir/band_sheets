/**
 * Migration script to update all existing sheets to be public by default
 * Run this script with: node make-sheets-public.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bandsheets', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB database');
  
  try {
    // Get the Sheet model
    const Sheet = require('../models/sheet');
    
    // Find all sheets where isPublic is false or not set
    const sheetsToUpdate = await Sheet.find({
      $or: [
        { isPublic: false },
        { isPublic: { $exists: false } }
      ]
    });
    
    console.log(`Found ${sheetsToUpdate.length} sheets to update`);
    
    // Update all sheets to be public
    const updateResult = await Sheet.updateMany(
      {
        $or: [
          { isPublic: false },
          { isPublic: { $exists: false } }
        ]
      },
      { $set: { isPublic: true } }
    );
    
    console.log(`Updated ${updateResult.modifiedCount} sheets to be public`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error updating sheets:', error);
    process.exit(1);
  }
});
