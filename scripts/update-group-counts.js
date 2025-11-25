// Update Group Student Counts
// Usage: node scripts/update-group-counts.js

require('dotenv').config();
const mongoose = require('mongoose');
const Group = require('../models/Group');
const ManagedStudent = require('../models/ManagedStudent');

async function updateGroupCounts() {
  try {
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');
    
    console.log('🔄 Updating group student counts...\n');
    
    // Get all groups
    const groups = await Group.find();
    
    for (const group of groups) {
      // Count students in this group
      const studentCount = await ManagedStudent.countDocuments({ group: group._id });
      
      // Update the group
      group.currentStudentCount = studentCount;
      await group.save();
      
      console.log(`✅ ${group.name}: ${studentCount}/${group.maxStudents} students`);
    }
    
    console.log(`\n✅ Updated ${groups.length} groups`);
    
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

updateGroupCounts();
