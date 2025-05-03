/**
 * Script to update ownership of all sheets in the database to a specific user
 * Usage: node update-sheet-ownership.js <username>
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/user');
const Sheet = require('../models/sheet');
const Setlist = require('../models/setlist');
const path = require('path');

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Get the username from command line args or use default
const username = process.argv[2] || 'admin';

console.log(`Updating ownership of all sheets and setlists to user: ${username}`);

async function updateOwnership() {
  try {
    // Connect to the database
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/band-sheets';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB Connected...');
    
    // Find the target user
    const user = await User.findOne({ username });
    
    if (!user) {
      console.error(`User ${username} not found in the database`);
      process.exit(1);
    }
    
    console.log(`Found user: ${user.username} (${user._id})`);
    
    // Update all sheets to be owned by this user
    const sheetResult = await Sheet.updateMany(
      {}, // filter - empty to match all sheets
      { 
        $set: { owner: user._id },
        // Also remove any sharing restrictions
        $set: { isPublic: true }
      }
    );
    
    console.log(`Updated ownership for ${sheetResult.modifiedCount} sheets`);
    
    // Also update all setlists to be owned by this user
    const setlistResult = await Setlist.updateMany(
      {}, // filter - empty to match all setlists
      { 
        $set: { owner: user._id },
        // Also remove any sharing restrictions
        $set: { isPublic: true }
      }
    );
    
    console.log(`Updated ownership for ${setlistResult.modifiedCount} setlists`);
    
    // Verify the updates
    const sheetCount = await Sheet.countDocuments({ owner: user._id });
    const setlistCount = await Setlist.countDocuments({ owner: user._id });
    
    console.log(`Verification: ${sheetCount} sheets and ${setlistCount} setlists are now owned by ${username}`);
    
    console.log('Operation completed successfully');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
}

updateOwnership();
