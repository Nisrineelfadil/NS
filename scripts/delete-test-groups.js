// Quick script to delete test groups
require('dotenv').config();
const mongoose = require('mongoose');
const Group = require('../models/Group');

async function deleteTestGroups() {
  try {
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');
    
    const count = await Group.countDocuments({ isTestData: true });
    console.log(`Found ${count} test groups`);
    
    if (count > 0) {
      await Group.deleteMany({ isTestData: true });
      console.log(`✅ Deleted ${count} test groups\n`);
    } else {
      console.log('✅ No test groups to delete\n');
    }
    
    await mongoose.connection.close();
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteTestGroups();
