/**
 * Script to list all users in the database
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Define a simple User model based on the existing schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  name: String
});

const User = mongoose.model('User', userSchema);

async function listAllUsers() {
  try {
    // Connect to the database
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/band-sheets';
    await mongoose.connect(mongoUri);
    
    console.log('MongoDB Connected...');
    
    // Find all users
    const users = await User.find({}, 'username email name _id');
    
    console.log('Users in the database:');
    if (users.length === 0) {
      console.log('No users found');
    } else {
      users.forEach(user => {
        console.log(`ID: ${user._id}, Username: ${user.username}, Email: ${user.email}, Name: ${user.name || 'N/A'}`);
      });
      console.log(`Total users: ${users.length}`);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
}

listAllUsers();
