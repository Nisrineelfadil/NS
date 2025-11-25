// Delete all Allemand test groups by name pattern
require('dotenv').config();
const mongoose = require('mongoose');
const Group = require('../models/Group');

async function deleteAllemandGroups() {
  try {
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');
    
    // Find all groups with "Allemand" in the name
    const allemandGroups = await Group.find({
      name: { $regex: /^Allemand/, $options: 'i' }
    });
    
    console.log(`Found ${allemandGroups.length} Allemand groups:\n`);
    allemandGroups.forEach((group, index) => {
      console.log(`  ${index + 1}. ${group.name} (${group.formation})`);
    });
    
    if (allemandGroups.length > 0) {
      console.log('\n⚠️  Deleting all Allemand groups...');
      const result = await Group.deleteMany({
        name: { $regex: /^Allemand/, $options: 'i' }
      });
      console.log(`✅ Deleted ${result.deletedCount} Allemand groups\n`);
    } else {
      console.log('\n✅ No Allemand groups to delete\n');
    }
    
    // Verify deletion
    const remaining = await Group.countDocuments({
      name: { $regex: /^Allemand/, $options: 'i' }
    });
    console.log(`Remaining Allemand groups: ${remaining}`);
    
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

deleteAllemandGroups();
