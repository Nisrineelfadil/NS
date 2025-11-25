// Verify Test Data - Check system status and test data
// Usage: node scripts/verify-test-data.js

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const ManagedStudent = require('../models/ManagedStudent');
const Grade = require('../models/Grade');
const AttendanceRecord = require('../models/AttendanceRecord');
const PaymentHistory = require('../models/PaymentHistory');
const Group = require('../models/Group');
const PushSubscription = require('../models/PushSubscription');
const Notification = require('../models/Notification');

async function verifyTestData() {
  console.log('🔍 TEST DATA VERIFICATION SCRIPT\n');
  
  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Get database statistics
    const stats = await mongoose.connection.db.stats();
    const sizeMB = (stats.dataSize / (1024 * 1024)).toFixed(2);
    const storageSizeMB = (stats.storageSize / (1024 * 1024)).toFixed(2);
    const indexSizeMB = (stats.indexSize / (1024 * 1024)).toFixed(2);
    
    console.log('💾 DATABASE STATISTICS:');
    console.log(`  - Data size: ${sizeMB} MB`);
    console.log(`  - Storage size: ${storageSizeMB} MB`);
    console.log(`  - Index size: ${indexSizeMB} MB`);
    console.log(`  - Total collections: ${stats.collections}`);
    console.log(`  - Total documents: ${stats.objects}`);
    console.log(`  - Capacity used: ${((sizeMB / 512) * 100).toFixed(1)}% of 512 MB M0\n`);
    
    // Count all students
    const totalStudents = await ManagedStudent.countDocuments();
    const realStudents = await ManagedStudent.countDocuments({ isTestData: { $ne: true } });
    const testStudents = await ManagedStudent.countDocuments({ isTestData: true });
    
    console.log('👥 STUDENT STATISTICS:');
    console.log(`  - Total students: ${totalStudents}`);
    console.log(`  - Real students: ${realStudents}`);
    console.log(`  - Test students: ${testStudents}\n`);
    
    if (testStudents > 0) {
      // Get test student IDs
      const testStudentDocs = await ManagedStudent.find({ isTestData: true }).select('_id');
      const testStudentIds = testStudentDocs.map(s => s._id);
      
      // Count test data
      const testGrades = await Grade.countDocuments({ student: { $in: testStudentIds } });
      const testAttendance = await AttendanceRecord.countDocuments({ studentId: { $in: testStudentIds } });
      const testPayments = await PaymentHistory.countDocuments({ student: { $in: testStudentIds } });
      const testGroups = await Group.countDocuments({ isTestData: true });
      const testPush = await PushSubscription.countDocuments({ student: { $in: testStudentIds } });
      const testNotifications = await Notification.countDocuments({ relatedId: { $in: testStudentIds } });
      
      console.log('📋 TEST DATA BREAKDOWN:');
      console.log(`  - Test students: ${testStudents}`);
      console.log(`  - Test grades: ${testGrades}`);
      console.log(`  - Test attendance: ${testAttendance}`);
      console.log(`  - Test payments: ${testPayments}`);
      console.log(`  - Test groups: ${testGroups}`);
      console.log(`  - Test push subscriptions: ${testPush}`);
      console.log(`  - Test notifications: ${testNotifications}`);
      
      const totalTestDocs = testStudents + testGrades + testAttendance + testPayments + testGroups + testPush + testNotifications;
      console.log(`  - Total test documents: ${totalTestDocs}\n`);
      
      // Calculate estimated test data size
      const avgStudentSize = 1.22; // MB per student (without photos)
      const estimatedTestSize = (testStudents * avgStudentSize * 1.4).toFixed(2); // With 40% overhead
      console.log(`📊 ESTIMATED TEST DATA SIZE: ${estimatedTestSize} MB\n`);
      
      // Show sample test students
      const sampleStudents = await ManagedStudent.find({ isTestData: true })
        .select('fullName email formation groupName enrollmentDate')
        .limit(10);
      
      console.log('📝 SAMPLE TEST STUDENTS (first 10):');
      sampleStudents.forEach((student, index) => {
        console.log(`  ${index + 1}. ${student.fullName}`);
        console.log(`     Email: ${student.email}`);
        console.log(`     Formation: ${student.formation}`);
        console.log(`     Group: ${student.groupName}`);
        console.log(`     Enrolled: ${student.enrollmentDate.toLocaleDateString()}`);
      });
      
      if (testStudents > 10) {
        console.log(`  ... and ${testStudents - 10} more test students\n`);
      } else {
        console.log('');
      }
      
      // Test data status
      console.log('⚠️  TEST DATA STATUS:');
      console.log(`  ✅ Test data is present in the system`);
      console.log(`  ⚠️  Remember to clean up after demo`);
      console.log(`  📝 Run: node scripts/cleanup-test-students.js\n`);
      
    } else {
      console.log('✅ NO TEST DATA FOUND');
      console.log('   System is clean and ready for production\n');
    }
    
    // Count real data
    if (realStudents > 0) {
      const realStudentDocs = await ManagedStudent.find({ isTestData: { $ne: true } }).select('_id');
      const realStudentIds = realStudentDocs.map(s => s._id);
      
      const realGrades = await Grade.countDocuments({ student: { $in: realStudentIds } });
      const realAttendance = await AttendanceRecord.countDocuments({ studentId: { $in: realStudentIds } });
      const realPayments = await PaymentHistory.countDocuments({ student: { $in: realStudentIds } });
      const realGroups = await Group.countDocuments({ isTestData: { $ne: true } });
      
      console.log('📋 REAL DATA (PRODUCTION):');
      console.log(`  - Real students: ${realStudents}`);
      console.log(`  - Real grades: ${realGrades}`);
      console.log(`  - Real attendance: ${realAttendance}`);
      console.log(`  - Real payments: ${realPayments}`);
      console.log(`  - Real groups: ${realGroups}`);
      
      const totalRealDocs = realStudents + realGrades + realAttendance + realPayments + realGroups;
      console.log(`  - Total real documents: ${totalRealDocs}\n`);
      
      // Show real students
      const realStudentsList = await ManagedStudent.find({ isTestData: { $ne: true } })
        .select('fullName email formation groupName enrollmentDate')
        .limit(10);
      
      console.log('📝 REAL STUDENTS (first 10):');
      realStudentsList.forEach((student, index) => {
        console.log(`  ${index + 1}. ${student.fullName}`);
        console.log(`     Email: ${student.email}`);
        console.log(`     Formation: ${student.formation || 'N/A'}`);
        console.log(`     Group: ${student.groupName || 'N/A'}`);
      });
      
      if (realStudents > 10) {
        console.log(`  ... and ${realStudents - 10} more real students\n`);
      } else {
        console.log('');
      }
    }
    
    // System health check
    console.log('🏥 SYSTEM HEALTH:');
    const capacityPercent = (sizeMB / 512) * 100;
    
    if (capacityPercent < 60) {
      console.log(`  ✅ HEALTHY - ${capacityPercent.toFixed(1)}% capacity used`);
      console.log(`     System has plenty of space`);
    } else if (capacityPercent < 80) {
      console.log(`  ⚠️  CAUTION - ${capacityPercent.toFixed(1)}% capacity used`);
      console.log(`     Consider upgrading to M2 soon`);
    } else if (capacityPercent < 90) {
      console.log(`  🚨 WARNING - ${capacityPercent.toFixed(1)}% capacity used`);
      console.log(`     Upgrade to M2 recommended immediately`);
    } else {
      console.log(`  🔴 CRITICAL - ${capacityPercent.toFixed(1)}% capacity used`);
      console.log(`     System may become unstable - UPGRADE NOW!`);
    }
    
    const remainingMB = (512 - sizeMB).toFixed(2);
    console.log(`  - Remaining space: ${remainingMB} MB\n`);
    
    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    if (testStudents > 0) {
      console.log(`  1. Test data is present - remember to clean up after demo`);
      console.log(`  2. Run cleanup: node scripts/cleanup-test-students.js`);
    }
    if (capacityPercent > 60) {
      console.log(`  3. Consider upgrading to M2 ($9/month) for better performance`);
    }
    if (realStudents > 100) {
      console.log(`  4. With ${realStudents} students, M2 is recommended for stability`);
    }
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error during verification:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  verifyTestData()
    .then(() => {
      console.log('\n✅ Verification completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyTestData };
