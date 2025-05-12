/**
 * Script to diagnose setlist ID inconsistencies in the MongoDB database
 * This will connect to the MongoDB container and check all setlists
 * for missing or inconsistent ID formats
 */

// Connect to MongoDB and run this script with:
// docker exec -i band-sheets-mongodb mongosh < diagnose-setlist-ids.js

// Switch to the bandsheets database
db = db.getSiblingDB('bandsheets');

// Find and display all setlists
console.log("=== All Setlists in Database ===");
const allSetlists = db.setlists.find().toArray();
allSetlists.forEach(s => console.log(`ID: ${s.id}, _id: ${s._id}, Name: ${s.name}`));

// Find setlists with missing custom 'id' field
console.log("\n=== Setlists WITH MISSING custom 'id' field ===");
const missingIdSetlists = db.setlists.find({ id: { $exists: false } }).toArray();
missingIdSetlists.forEach(s => console.log(`_id: ${s._id}, Name: ${s.name || 'unnamed'}`));

// Find setlists with unexpected id format (not starting with 'setlist_')
console.log("\n=== Setlists with INCORRECT ID FORMAT (should start with 'setlist_') ===");
const wrongFormatIds = db.setlists.find({ 
  id: { $exists: true },
  $or: [
    { id: { $not: /^setlist_/ } },
    { id: { $type: "objectId" } }  // Check if id is an ObjectId instead of string
  ]
}).toArray();
wrongFormatIds.forEach(s => console.log(`ID: ${s.id}, _id: ${s._id}, Name: ${s.name || 'unnamed'}`));

// Output total counts
console.log("\n=== Summary ===");
console.log(`Total setlists: ${allSetlists.length}`);
console.log(`Setlists missing 'id' field: ${missingIdSetlists.length}`);
console.log(`Setlists with incorrect id format: ${wrongFormatIds.length}`);
