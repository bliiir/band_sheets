/**
 * MongoDB script to assign all sheets and setlists to the existing user
 * 
 * This script is meant to be run directly in the MongoDB shell
 * inside the Docker container
 */

// Find the first user
var user = db.users.findOne();

if (!user) {
  print("No users found in the database");
  quit();
}

print("Found user: " + user.username + " (ID: " + user._id + ")");

// Count initial sheets and setlists
var initialSheetCount = db.sheets.count();
var initialSetlistCount = db.setlists.count();
print("Initial count: " + initialSheetCount + " sheets, " + initialSetlistCount + " setlists");

// Update all sheets
var sheetResult = db.sheets.updateMany(
  {}, // match all sheets
  { $set: { owner: user._id } }
);

print("Updated ownership for " + sheetResult.modifiedCount + " sheets");

// Update all setlists
var setlistResult = db.setlists.updateMany(
  {}, // match all setlists
  { $set: { owner: user._id } }
);

print("Updated ownership for " + setlistResult.modifiedCount + " setlists");

// Verify the updates
var updatedSheetCount = db.sheets.count({ owner: user._id });
var updatedSetlistCount = db.setlists.count({ owner: user._id });

print("Verification: " + updatedSheetCount + " sheets and " + updatedSetlistCount + " setlists are now owned by " + user.username);
