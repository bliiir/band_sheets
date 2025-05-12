// Fix setlist ownership script - to be run inside the backend container
const mongoose = require('mongoose');
const Setlist = require('./models/setlist');
const User = require('./models/user');

async function fixSetlistOwnership() {
  try {
    console.log('Connecting to MongoDB...');
    
    // Find the user by email
    const user = await User.findOne({ email: 'rasgroth@gmail.com' });
    
    if (!user) {
      console.error('User not found');
      return;
    }
    
    console.log(`Found user: ${user.email} with ID: ${user._id}`);
    
    // Find all setlists
    const setlists = await Setlist.find();
    
    console.log(`Found ${setlists.length} total setlists`);
    
    let updatedCount = 0;
    
    // Update each setlist to be owned by this user
    for (const setlist of setlists) {
      const currentOwner = setlist.owner ? setlist.owner.toString() : 'none';
      const userIdStr = user._id.toString();
      
      if (currentOwner !== userIdStr) {
        console.log(`Updating setlist: ${setlist.name} (${setlist.id})`);
        console.log(`  Current owner: ${currentOwner}`);
        
        // Update the owner
        setlist.owner = user._id;
        await setlist.save();
        
        console.log(`  New owner: ${setlist.owner}`);
        updatedCount++;
      }
    }
    
    console.log(`${updatedCount} setlists updated to belong to you`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing setlist ownership:', error);
    process.exit(1);
  }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bandsheets')
  .then(() => {
    console.log('MongoDB Connected');
    fixSetlistOwnership();
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });
