/**
 * Script to transfer ownership of all sheets and setlists to the user's account
 * This script finds the existing user and assigns all content to them
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function assignOwnership() {
  try {
    // Connect to the database
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/band-sheets';
    await mongoose.connect(mongoUri);
    
    console.log('MongoDB Connected...');
    
    // Get the User model
    const User = mongoose.model('User');
    
    // Find the user's account
    const users = await User.find({});
    
    if (users.length === 0) {
      console.error('No users found in the database. Cannot assign ownership.');
      return;
    }
    
    // Use the first available user (assuming this is yours)
    const user = users[0];
    console.log(`Using existing user: ${user.username} (ID: ${user._id})`);
    
    // Get the Sheet and Setlist models
    const Sheet = mongoose.model('Sheet');
    const Setlist = mongoose.model('Setlist');
    
    // Check existing content
    const existingSheets = await Sheet.countDocuments({});
    const existingSetlists = await Setlist.countDocuments({});
    console.log(`Found ${existingSheets} existing sheets and ${existingSetlists} existing setlists`);
    
    // Update all sheets to be owned by this user
    const sheetResult = await Sheet.updateMany(
      {}, // match all sheets
      { $set: { owner: user._id } }
    );
    
    console.log(`Updated ownership for ${sheetResult.modifiedCount} sheets`);
    
    // Update all setlists to be owned by this user
    const setlistResult = await Setlist.updateMany(
      {}, // match all setlists
      { $set: { owner: user._id } }
    );
    
    console.log(`Updated ownership for ${setlistResult.modifiedCount} setlists`);
    
    // Verify the updates
    const sheetCount = await Sheet.countDocuments({ owner: user._id });
    const setlistCount = await Setlist.countDocuments({ owner: user._id });
    
    console.log(`Verification: ${sheetCount} sheets and ${setlistCount} setlists are now owned by ${user.username}`);
    
  } catch (err) {
    console.error('Error:', err.message);
    if (err.message.includes('Model.init() requires a reference to a Mongoose connection')) {
      console.log('\nThis likely happened because the models were not registered. Please restart the backend and try again.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
}

assignOwnership();
