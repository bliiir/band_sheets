/**
 * Script to create a default user and assign all sheets and setlists to them
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Define schemas and models
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: String,
  isAdmin: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Get Sheet and Setlist models if they exist
let Sheet, Setlist;
try {
  Sheet = mongoose.model('Sheet');
  Setlist = mongoose.model('Setlist');
} catch(e) {
  // If models don't exist yet, define them
  const sheetSchema = new mongoose.Schema({
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Other fields would be defined here
  });
  
  const setlistSchema = new mongoose.Schema({
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Other fields would be defined here
  });
  
  Sheet = mongoose.model('Sheet', sheetSchema);
  Setlist = mongoose.model('Setlist', setlistSchema);
}

async function setupDefaultUser() {
  try {
    // Connect to the database
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/band-sheets';
    await mongoose.connect(mongoUri);
    
    console.log('MongoDB Connected...');
    
    // Check if any users exist
    const existingUsers = await User.find({});
    let defaultUser;
    
    if (existingUsers.length === 0) {
      console.log('No users found. Creating default user...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      // Create a default user
      defaultUser = await User.create({
        username: 'default',
        email: 'default@example.com',
        password: hashedPassword,
        name: 'Default User',
        isAdmin: true
      });
      
      console.log(`Created default user: ${defaultUser.username} (ID: ${defaultUser._id})`);
    } else {
      defaultUser = existingUsers[0];
      console.log(`Using existing user: ${defaultUser.username} (ID: ${defaultUser._id})`);
    }
    
    // Update all sheets to be owned by this user
    const sheetResult = await Sheet.updateMany(
      {}, // match all sheets
      { $set: { owner: defaultUser._id } }
    );
    
    console.log(`Updated ownership for ${sheetResult.modifiedCount} sheets`);
    
    // Update all setlists to be owned by this user
    const setlistResult = await Setlist.updateMany(
      {}, // match all setlists
      { $set: { owner: defaultUser._id } }
    );
    
    console.log(`Updated ownership for ${setlistResult.modifiedCount} setlists`);
    
    // Verify the updates
    const sheetCount = await Sheet.countDocuments({ owner: defaultUser._id });
    const setlistCount = await Setlist.countDocuments({ owner: defaultUser._id });
    
    console.log(`Verification: ${sheetCount} sheets and ${setlistCount} setlists are now owned by ${defaultUser.username}`);
    
    console.log(`\nDEFAULT USER CREDENTIALS:`);
    console.log(`Username: ${defaultUser.username}`);
    console.log(`Password: password123`);
    console.log(`Email: ${defaultUser.email}`);
    console.log(`\nUSE THESE CREDENTIALS TO LOG IN TO THE APPLICATION`);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
}

setupDefaultUser();
