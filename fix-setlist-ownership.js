// Connect to MongoDB and fix setlist ownership
const mongoose = require('mongoose');
const config = require('./band-sheets-backend/config/config');

// Set up the MongoDB connection
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Get the connection
const db = mongoose.connection;

// Log connection status
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
  fixSetlistOwnership();
});

// Function to fix setlist ownership
async function fixSetlistOwnership() {
  try {
    // Get the Setlist model
    const Setlist = require('./band-sheets-backend/models/setlist');
    const User = require('./band-sheets-backend/models/user');
    
    // Find the user by email
    const user = await User.findOne({ email: 'rasgroth@gmail.com' });
    
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }
    
    console.log(`Found user: ${user.email} with ID: ${user._id}`);
    
    // Find all setlists that aren't already owned by this user
    const setlists = await Setlist.find({ owner: { $ne: user._id } });
    
    console.log(`Found ${setlists.length} setlists to update`);
    
    // Update each setlist to be owned by this user
    for (const setlist of setlists) {
      console.log(`Updating setlist: ${setlist.name} (${setlist.id})`);
      console.log(`  Current owner: ${setlist.owner}`);
      
      // Update the owner
      setlist.owner = user._id;
      await setlist.save();
      
      console.log(`  New owner: ${setlist.owner}`);
    }
    
    console.log('All setlists updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing setlist ownership:', error);
    process.exit(1);
  }
}
