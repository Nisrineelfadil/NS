// Cleanup OLD Test Students - Safe Removal
// Usage: node scripts/cleanup-old-test-students.js
// This script removes ONLY students from old test batches (keeps real students safe!)

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

// Create readline interface for user confirmation
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

async function cleanupOldTestData() {
  console.log('🧹 OLD TEST DATA CLEANUP SCRIPT\n');
  console.log('⚠️  This will delete students from old test batches ONLY\n');
  console.log('✅ Your REAL students will be SAFE!\n');
  
  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Check current database size
    const statsBefore = await mongoose.connection.db.stats();
    const sizeBefore = (statsBefore.dataSize / (1024 * 1024)).toFixed(2);
    console.log(`📊 Current database size: ${sizeBefore} MB\n`);
    
    // Strategy: Find students that match OLD test patterns
    // Old test students have:
    // 1. Allemand formation
    // 2. Groups named "Allemand A1/A2/B1/B2 - Groupe X"
    // 3. Email pattern: firstname.lastname@nisrineschool.com
    // 4. NO isTestData flag (or isTestData: true)
    
    console.log('🔍 Scanning for old test data...\n');
    
    // Find groups that look like test groups
    const testGroupPattern = /^Allemand (A1|A2|B1|B2) - Groupe \d+$/;
    const testGroups = await Group.find({ 
      name: { $regex: testGroupPattern }
    }).select('_id name');
    
    console.log(`Found ${testGroups.length} test-pattern groups:`);
    testGroups.forEach(g => console.log(`  - ${g.name}`));
    console.log('');
    
    if (testGroups.length === 0) {
      console.log('✅ No old test groups found. System is clean!');
      rl.close();
      await mongoose.disconnect();
      console.log('📡 Database connection closed\n');
      return;
    }
    
    const testGroupIds = testGroups.map(g => g._id);
    
    // Find students in these test groups
    const oldTestStudents = await ManagedStudent.find({ 
      group: { $in: testGroupIds }
    }).select('_id fullName formation groupName schoolEmail');
    
    const studentIds = oldTestStudents.map(s => s._id);
    
    if (studentIds.length === 0) {
      console.log('✅ No old test students found. System is clean!');
      rl.close();
      await mongoose.disconnect();
      console.log('📡 Database connection closed\n');
      return;
    }
    
    console.log(`Found old test students: ${studentIds.length}\n`);
    
    // Count associated data
    const gradesCount = await Grade.countDocuments({ student: { $in: studentIds } });
    const attendanceCount = await AttendanceRecord.countDocuments({ studentId: { $in: studentIds } });
    const paymentsCount = await PaymentHistory.countDocuments({ student: { $in: studentIds } });
    const pushCount = await PushSubscription.countDocuments({ student: { $in: studentIds } });
    const notificationsCount = await Notification.countDocuments({ relatedId: { $in: studentIds } });
    
    console.log(`Associated data:`);
    console.log(`  - Students: ${studentIds.length}`);
    console.log(`  - Grades: ${gradesCount}`);
    console.log(`  - Attendance records: ${attendanceCount}`);
    console.log(`  - Payment records: ${paymentsCount}`);
    console.log(`  - Groups: ${testGroups.length}`);
    console.log(`  - Push subscriptions: ${pushCount}`);
    console.log(`  - Notifications: ${notificationsCount}`);
    
    const totalDocuments = studentIds.length + gradesCount + attendanceCount + 
                          paymentsCount + testGroups.length + pushCount + notificationsCount;
    console.log(`\n📋 Total documents to delete: ${totalDocuments}\n`);
    
    // Show sample of students to be deleted
    console.log('Sample of students to be deleted:');
    oldTestStudents.slice(0, 10).forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.fullName} - ${student.groupName} (${student.schoolEmail})`);
    });
    if (oldTestStudents.length > 10) {
      console.log(`  ... and ${oldTestStudents.length - 10} more\n`);
    } else {
      console.log('');
    }
    
    // SAFETY CHECK: Show what will be KEPT
    const realStudents = await ManagedStudent.find({ 
      group: { $nin: testGroupIds }
    }).select('fullName formation groupName');
    
    console.log(`\n✅ STUDENTS THAT WILL BE KEPT (${realStudents.length}):`);
    if (realStudents.length > 0) {
      realStudents.slice(0, 5).forEach((student, index) => {
        console.log(`  ${index + 1}. ${student.fullName} - ${student.groupName} (${student.formation.join(', ')})`);
      });
      if (realStudents.length > 5) {
        console.log(`  ... and ${realStudents.length - 5} more\n`);
      } else {
        console.log('');
      }
    } else {
      console.log('  (None - all students are in test groups)\n');
    }
    
    // Ask for confirmation
    const answer = await askQuestion('\n⚠️  Delete old test data? Real students will be SAFE. (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Cleanup cancelled by user');
      rl.close();
      await mongoose.disconnect();
      console.log('📡 Database connection closed\n');
      return;
    }
    
    console.log('\n🗑️  Starting deletion...\n');
    
    // Delete in order (to maintain referential integrity)
    
    // 1. Delete notifications
    if (notificationsCount > 0) {
      console.log('📢 Deleting notifications...');
      await Notification.deleteMany({ relatedId: { $in: studentIds } });
      console.log(`   ✅ Deleted ${notificationsCount} notifications\n`);
    }
    
    // 2. Delete push subscriptions
    if (pushCount > 0) {
      console.log('🔔 Deleting push subscriptions...');
      await PushSubscription.deleteMany({ student: { $in: studentIds } });
      console.log(`   ✅ Deleted ${pushCount} push subscriptions\n`);
    }
    
    // 3. Delete grades
    if (gradesCount > 0) {
      console.log('📝 Deleting grades...');
      await Grade.deleteMany({ student: { $in: studentIds } });
      console.log(`   ✅ Deleted ${gradesCount} grades\n`);
    }
    
    // 4. Delete attendance records
    if (attendanceCount > 0) {
      console.log('📅 Deleting attendance records...');
      await AttendanceRecord.deleteMany({ studentId: { $in: studentIds } });
      console.log(`   ✅ Deleted ${attendanceCount} attendance records\n`);
    }
    
    // 5. Delete payment records
    if (paymentsCount > 0) {
      console.log('💰 Deleting payment records...');
      await PaymentHistory.deleteMany({ student: { $in: studentIds } });
      console.log(`   ✅ Deleted ${paymentsCount} payment records\n`);
    }
    
    // 6. Delete students
    console.log('👥 Deleting old test students...');
    await ManagedStudent.deleteMany({ _id: { $in: studentIds } });
    console.log(`   ✅ Deleted ${studentIds.length} students\n`);
    
    // 7. Delete test groups
    console.log('📋 Deleting test groups...');
    await Group.deleteMany({ _id: { $in: testGroupIds } });
    console.log(`   ✅ Deleted ${testGroups.length} groups\n`);
    
    // Check final database size
    const statsAfter = await mongoose.connection.db.stats();
    const sizeAfter = (statsAfter.dataSize / (1024 * 1024)).toFixed(2);
    const sizeFreed = (sizeBefore - sizeAfter).toFixed(2);
    
    // Verify real students are still there
    const remainingStudents = await ManagedStudent.countDocuments();
    
    console.log('📊 Final Statistics:');
    console.log(`   - Database size before: ${sizeBefore} MB`);
    console.log(`   - Database size after: ${sizeAfter} MB`);
    console.log(`   - Space freed: ${sizeFreed} MB`);
    console.log(`   - Real students remaining: ${remainingStudents}\n`);
    
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
cleanupOldTestData();
