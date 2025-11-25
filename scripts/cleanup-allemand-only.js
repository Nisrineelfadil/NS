// Cleanup ONLY Allemand Test Students - Keep Real Students Safe
// Usage: node scripts/cleanup-allemand-only.js
// This script removes ONLY students in Allemand groups, keeps Group A/B/C safe

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

// Import models
const ManagedStudent = require('../models/ManagedStudent');
const Grade = require('../models/Grade');
const AttendanceRecord = require('../models/AttendanceRecord');
const PaymentHistory = require('../models/PaymentHistory');
const Group = require('../models/Group');
const PushSubscription = require('../models/PushSubscription');
const Notification = require('../models/Notification');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

async function cleanupAllemandOnly() {
  console.log('🧹 CLEANUP ALLEMAND TEST STUDENTS ONLY\n');
  console.log('✅ This will KEEP your real students in Group A, B, C safe!\n');
  
  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Find ONLY Allemand groups
    const allemandGroups = await Group.find({ 
      name: { $regex: /^Allemand (A1|A2|B1|B2) - Groupe \d+$/ }
    }).select('_id name');
    
    console.log(`Found ${allemandGroups.length} Allemand test groups:\n`);
    allemandGroups.forEach(g => console.log(`  - ${g.name}`));
    console.log('');
    
    if (allemandGroups.length === 0) {
      console.log('✅ No Allemand groups found. System is clean!');
      rl.close();
      await mongoose.disconnect();
      return;
    }
    
    const allemandGroupIds = allemandGroups.map(g => g._id);
    
    // Find students ONLY in Allemand groups
    const allemandStudents = await ManagedStudent.find({ 
      group: { $in: allemandGroupIds }
    }).select('_id fullName groupName schoolEmail');
    
    const studentIds = allemandStudents.map(s => s._id);
    
    console.log(`Found ${allemandStudents.length} students in Allemand groups\n`);
    
    // Count associated data
    const gradesCount = await Grade.countDocuments({ student: { $in: studentIds } });
    const paymentsCount = await PaymentHistory.countDocuments({ student: { $in: studentIds } });
    
    console.log(`Data to delete:`);
    console.log(`  - Students: ${studentIds.length}`);
    console.log(`  - Grades: ${gradesCount}`);
    console.log(`  - Payments: ${paymentsCount}`);
    console.log(`  - Groups: ${allemandGroups.length}\n`);
    
    // Show what will be KEPT
    const realStudents = await ManagedStudent.find({ 
      group: { $nin: allemandGroupIds }
    }).select('fullName groupName');
    
    console.log(`✅ STUDENTS THAT WILL BE KEPT SAFE (${realStudents.length}):\n`);
    realStudents.forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.fullName} - ${student.groupName}`);
    });
    console.log('');
    
    // Ask for confirmation
    const answer = await askQuestion('⚠️  Delete ONLY Allemand students? Your real students will be SAFE. (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Cleanup cancelled');
      rl.close();
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n🗑️  Starting deletion...\n');
    
    // Delete grades
    if (gradesCount > 0) {
      console.log('📝 Deleting grades...');
      await Grade.deleteMany({ student: { $in: studentIds } });
      console.log(`   ✅ Deleted ${gradesCount} grades\n`);
    }
    
    // Delete payments
    if (paymentsCount > 0) {
      console.log('💰 Deleting payments...');
      await PaymentHistory.deleteMany({ student: { $in: studentIds } });
      console.log(`   ✅ Deleted ${paymentsCount} payments\n`);
    }
    
    // Delete students
    console.log('👥 Deleting Allemand students...');
    await ManagedStudent.deleteMany({ _id: { $in: studentIds } });
    console.log(`   ✅ Deleted ${studentIds.length} students\n`);
    
    // Delete groups
    console.log('📋 Deleting Allemand groups...');
    await Group.deleteMany({ _id: { $in: allemandGroupIds } });
    console.log(`   ✅ Deleted ${allemandGroups.length} groups\n`);
    
    // Verify real students are still there
    const remainingStudents = await ManagedStudent.countDocuments();
    const remainingGroups = await Group.countDocuments();
    
    console.log('📊 Final Statistics:');
    console.log(`   - Real students remaining: ${remainingStudents}`);
    console.log(`   - Real groups remaining: ${remainingGroups}\n`);
    
    console.log('✅ Cleanup completed successfully!\n');
    console.log('💡 You can now run: node scripts/generate-test-students.js\n');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.disconnect();
    console.log('📡 Database connection closed\n');
  }
}

// Run the cleanup
cleanupAllemandOnly();
