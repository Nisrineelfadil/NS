// Cleanup Test Students - Complete Removal
// Usage: node scripts/cleanup-test-students.js
// This script removes ALL test data, leaving the system clean as new

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

// Configuration
const TEST_BATCH_ID = 'demo-2024';

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

async function cleanupTestData() {
  console.log('🧹 TEST DATA CLEANUP SCRIPT\n');
  console.log('⚠️  WARNING: This will permanently delete ALL test data!\n');
  
  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Check current database size
    const statsBefore = await mongoose.connection.db.stats();
    const sizeBefore = (statsBefore.dataSize / (1024 * 1024)).toFixed(2);
    console.log(`📊 Current database size: ${sizeBefore} MB\n`);
    
    // Find all test students
    console.log('🔍 Scanning for test data...\n');
    const testStudents = await ManagedStudent.find({ isTestData: true }).select('_id fullName');
    const testStudentIds = testStudents.map(s => s._id);
    
    if (testStudentIds.length === 0) {
      console.log('✅ No test students found. System is already clean!');
      return;
    }
    
    console.log(`Found test data:`);
    console.log(`  - Students: ${testStudentIds.length}`);
    
    // Count associated data
    const gradesCount = await Grade.countDocuments({ student: { $in: testStudentIds } });
    const attendanceCount = await AttendanceRecord.countDocuments({ studentId: { $in: testStudentIds } });
    const paymentsCount = await PaymentHistory.countDocuments({ student: { $in: testStudentIds } });
    const groupsCount = await Group.countDocuments({ isTestData: true });
    const pushCount = await PushSubscription.countDocuments({ student: { $in: testStudentIds } });
    const notificationsCount = await Notification.countDocuments({ relatedId: { $in: testStudentIds } });
    
    console.log(`  - Grades: ${gradesCount}`);
    console.log(`  - Attendance records: ${attendanceCount}`);
    console.log(`  - Payment records: ${paymentsCount}`);
    console.log(`  - Groups: ${groupsCount}`);
    console.log(`  - Push subscriptions: ${pushCount}`);
    console.log(`  - Notifications: ${notificationsCount}`);
    
    const totalDocuments = testStudentIds.length + gradesCount + attendanceCount + 
                          paymentsCount + groupsCount + pushCount + notificationsCount;
    console.log(`\n📋 Total documents to delete: ${totalDocuments}\n`);
    
    // Show sample of students to be deleted
    console.log('Sample of students to be deleted:');
    testStudents.slice(0, 5).forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.fullName}`);
    });
    if (testStudents.length > 5) {
      console.log(`  ... and ${testStudents.length - 5} more\n`);
    } else {
      console.log('');
    }
    
    // Ask for confirmation
    const answer = await askQuestion('⚠️  Are you sure you want to delete ALL test data? (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Cleanup cancelled by user');
      return;
    }
    
    console.log('\n🗑️  Starting deletion process...\n');
    
    // Delete associated data first (to avoid orphaned records)
    console.log('📋 Deleting associated data...');
    
    // Delete grades
    process.stdout.write('  - Deleting grades... ');
    const gradesDeleted = await Grade.deleteMany({ student: { $in: testStudentIds } });
    console.log(`✅ ${gradesDeleted.deletedCount} deleted`);
    
    // Delete attendance records
    process.stdout.write('  - Deleting attendance records... ');
    const attendanceDeleted = await AttendanceRecord.deleteMany({ studentId: { $in: testStudentIds } });
    console.log(`✅ ${attendanceDeleted.deletedCount} deleted`);
    
    // Delete payment history
    process.stdout.write('  - Deleting payment records... ');
    const paymentsDeleted = await PaymentHistory.deleteMany({ student: { $in: testStudentIds } });
    console.log(`✅ ${paymentsDeleted.deletedCount} deleted`);
    
    // Delete push subscriptions
    process.stdout.write('  - Deleting push subscriptions... ');
    const pushDeleted = await PushSubscription.deleteMany({ student: { $in: testStudentIds } });
    console.log(`✅ ${pushDeleted.deletedCount} deleted`);
    
    // Delete notifications
    process.stdout.write('  - Deleting notifications... ');
    const notificationsDeleted = await Notification.deleteMany({ relatedId: { $in: testStudentIds } });
    console.log(`✅ ${notificationsDeleted.deletedCount} deleted`);
    
    // Delete test groups
    console.log('\n📋 Deleting test groups...');
    process.stdout.write('  - Deleting groups... ');
    const groupsDeleted = await Group.deleteMany({ isTestData: true });
    console.log(`✅ ${groupsDeleted.deletedCount} deleted`);
    
    // Delete test students (LAST)
    console.log('\n📋 Deleting test students...');
    process.stdout.write('  - Deleting students... ');
    const studentsDeleted = await ManagedStudent.deleteMany({ isTestData: true });
    console.log(`✅ ${studentsDeleted.deletedCount} deleted`);
    
    // Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    const remainingTestStudents = await ManagedStudent.countDocuments({ isTestData: true });
    const remainingTestGrades = await Grade.countDocuments({ student: { $in: testStudentIds } });
    const remainingTestGroups = await Group.countDocuments({ isTestData: true });
    const remainingTestAttendance = await AttendanceRecord.countDocuments({ studentId: { $in: testStudentIds } });
    const remainingTestPayments = await PaymentHistory.countDocuments({ student: { $in: testStudentIds } });
    
    if (remainingTestStudents === 0 && 
        remainingTestGrades === 0 && 
        remainingTestGroups === 0 &&
        remainingTestAttendance === 0 &&
        remainingTestPayments === 0) {
      console.log('✅ CLEANUP COMPLETE - All test data removed!\n');
    } else {
      console.log('⚠️  WARNING: Some test data may remain:');
      if (remainingTestStudents > 0) console.log(`  - Test students: ${remainingTestStudents}`);
      if (remainingTestGrades > 0) console.log(`  - Test grades: ${remainingTestGrades}`);
      if (remainingTestGroups > 0) console.log(`  - Test groups: ${remainingTestGroups}`);
      if (remainingTestAttendance > 0) console.log(`  - Test attendance: ${remainingTestAttendance}`);
      if (remainingTestPayments > 0) console.log(`  - Test payments: ${remainingTestPayments}`);
      console.log('');
    }
    
    // Check final database size
    const statsAfter = await mongoose.connection.db.stats();
    const sizeAfter = (statsAfter.dataSize / (1024 * 1024)).toFixed(2);
    const sizeRecovered = (sizeBefore - sizeAfter).toFixed(2);
    
    console.log('📊 Deletion Summary:');
    console.log(`  - Students deleted: ${studentsDeleted.deletedCount}`);
    console.log(`  - Grades deleted: ${gradesDeleted.deletedCount}`);
    console.log(`  - Attendance deleted: ${attendanceDeleted.deletedCount}`);
    console.log(`  - Payments deleted: ${paymentsDeleted.deletedCount}`);
    console.log(`  - Groups deleted: ${groupsDeleted.deletedCount}`);
    console.log(`  - Push subscriptions deleted: ${pushDeleted.deletedCount}`);
    console.log(`  - Notifications deleted: ${notificationsDeleted.deletedCount}`);
    console.log(`  - Total documents deleted: ${studentsDeleted.deletedCount + gradesDeleted.deletedCount + attendanceDeleted.deletedCount + paymentsDeleted.deletedCount + groupsDeleted.deletedCount + pushDeleted.deletedCount + notificationsDeleted.deletedCount}`);
    
    console.log(`\n💾 Database size:`);
    console.log(`  - Before cleanup: ${sizeBefore} MB`);
    console.log(`  - After cleanup: ${sizeAfter} MB`);
    console.log(`  - Space recovered: ${sizeRecovered} MB`);
    console.log(`  - Capacity used: ${((sizeAfter / 512) * 100).toFixed(1)}% of 512 MB\n`);
    
    console.log('✨ System is now clean as new!');
    console.log('✅ Ready for production use\n');
    
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  cleanupTestData()
    .then(() => {
      console.log('\n✅ Cleanup completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupTestData };
