// Cleanup Test Students by Email Pattern - Safe & Smart
// Usage: node scripts/cleanup-by-email-pattern.js
// Identifies test students by email pattern (name.lastname0-149@nisrineschool.com)

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

// Import models
const ManagedStudent = require('../models/ManagedStudent');
const Grade = require('../models/Grade');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSession = require('../models/AttendanceSession');
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

async function cleanupByEmailPattern() {
  console.log('🧹 CLEANUP TEST STUDENTS BY EMAIL PATTERN\n');
  console.log('✅ This will identify test students by their email pattern!\n');
  
  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Get all students
    const allStudents = await ManagedStudent.find({}).select('_id fullName schoolEmail groupName createdAt');
    
    console.log(`📊 Total students in system: ${allStudents.length}\n`);
    
    // Identify test students by email pattern
    // Test pattern: name.lastname0@nisrineschool.com through name.lastname149@nisrineschool.com
    const testStudents = [];
    const realStudents = [];
    
    allStudents.forEach(student => {
      const email = student.schoolEmail || '';
      
      // Check if email matches test pattern: ends with a number before @nisrineschool.com
      // Examples: name.lastname0@, name.lastname149@, etc.
      const testPattern = /^[a-z]+\.[a-z\s]+\d+@nisrineschool\.com$/i;
      
      if (testPattern.test(email)) {
        testStudents.push(student);
      } else {
        realStudents.push(student);
      }
    });
    
    console.log('🔍 ANALYSIS BY EMAIL PATTERN:\n');
    console.log(`✅ REAL students (normal emails): ${realStudents.length}`);
    console.log(`🧪 TEST students (numbered emails): ${testStudents.length}\n`);
    
    if (testStudents.length === 0) {
      console.log('✅ No test students found. System is clean!');
      rl.close();
      await mongoose.disconnect();
      return;
    }
    
    // Show real students that will be KEPT
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`✅ REAL STUDENTS THAT WILL BE KEPT SAFE (${realStudents.length}):\n`);
    realStudents.forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.fullName} - ${student.groupName}`);
      console.log(`     Email: ${student.schoolEmail}\n`);
    });
    
    // Show test students that will be DELETED
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`🧪 TEST STUDENTS THAT WILL BE DELETED (${testStudents.length}):\n`);
    console.log('Sample (first 10):');
    testStudents.slice(0, 10).forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.fullName} - ${student.groupName}`);
      console.log(`     Email: ${student.schoolEmail}\n`);
    });
    if (testStudents.length > 10) {
      console.log(`  ... and ${testStudents.length - 10} more\n`);
    }
    
    const testStudentIds = testStudents.map(s => s._id);
    
    // Count associated data
    const gradesCount = await Grade.countDocuments({ student: { $in: testStudentIds } });
    const attendanceRecordsCount = await AttendanceRecord.countDocuments({ studentId: { $in: testStudentIds } });
    const paymentsCount = await PaymentHistory.countDocuments({ student: { $in: testStudentIds } });
    
    // Find groups that will be empty after deletion
    const testGroupNames = [...new Set(testStudents.map(s => s.groupName))];
    const groupsToDelete = await Group.find({ 
      name: { $in: testGroupNames }
    }).select('_id name');
    
    // Count attendance sessions for these groups
    const groupIds = groupsToDelete.map(g => g._id);
    const attendanceSessionsCount = await AttendanceSession.countDocuments({ groupId: { $in: groupIds } });
    
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📋 DATA TO DELETE:\n');
    console.log(`  - Students: ${testStudents.length}`);
    console.log(`  - Grades: ${gradesCount}`);
    console.log(`  - Attendance Records: ${attendanceRecordsCount}`);
    console.log(`  - Attendance Sessions: ${attendanceSessionsCount}`);
    console.log(`  - Payments: ${paymentsCount}`);
    console.log(`  - Groups: ${groupsToDelete.length}\n`);
    
    console.log('Groups to delete:');
    groupsToDelete.forEach(g => console.log(`  - ${g.name}`));
    console.log('');
    
    // Ask for confirmation
    const answer = await askQuestion('⚠️  Delete test students? Your real students will be SAFE. (yes/no): ');
    
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
      await Grade.deleteMany({ student: { $in: testStudentIds } });
      console.log(`   ✅ Deleted ${gradesCount} grades\n`);
    }
    
    // Delete attendance records
    if (attendanceRecordsCount > 0) {
      console.log('📋 Deleting attendance records...');
      await AttendanceRecord.deleteMany({ studentId: { $in: testStudentIds } });
      console.log(`   ✅ Deleted ${attendanceRecordsCount} attendance records\n`);
    }
    
    // Delete attendance sessions
    if (attendanceSessionsCount > 0) {
      console.log('📅 Deleting attendance sessions...');
      await AttendanceSession.deleteMany({ groupId: { $in: groupIds } });
      console.log(`   ✅ Deleted ${attendanceSessionsCount} attendance sessions\n`);
    }
    
    // Delete payments
    if (paymentsCount > 0) {
      console.log('💰 Deleting payments...');
      await PaymentHistory.deleteMany({ student: { $in: testStudentIds } });
      console.log(`   ✅ Deleted ${paymentsCount} payments\n`);
    }
    
    // Delete students
    console.log('👥 Deleting test students...');
    await ManagedStudent.deleteMany({ _id: { $in: testStudentIds } });
    console.log(`   ✅ Deleted ${testStudents.length} students\n`);
    
    // Delete empty groups
    if (groupsToDelete.length > 0) {
      console.log('📋 Deleting test groups...');
      await Group.deleteMany({ _id: { $in: groupsToDelete.map(g => g._id) } });
      console.log(`   ✅ Deleted ${groupsToDelete.length} groups\n`);
    }
    
    // Verify real students are still there
    const remainingStudents = await ManagedStudent.countDocuments();
    const remainingGroups = await Group.countDocuments();
    
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 FINAL STATISTICS:\n');
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
cleanupByEmailPattern();
