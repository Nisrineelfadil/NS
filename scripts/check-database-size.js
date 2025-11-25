// Check Database Size and Storage Usage
// Usage: node scripts/check-database-size.js

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const ManagedStudent = require('../models/ManagedStudent');
const Grade = require('../models/Grade');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSession = require('../models/AttendanceSession');
const PaymentHistory = require('../models/PaymentHistory');
const Group = require('../models/Group');
const Season = require('../models/Season');
const Admin = require('../models/Admin');

async function checkDatabaseSize() {
  console.log('📊 DATABASE SIZE ANALYSIS\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Get database statistics
    const stats = await mongoose.connection.db.stats();
    const dbSizeMB = (stats.dataSize / (1024 * 1024)).toFixed(2);
    const storageSizeMB = (stats.storageSize / (1024 * 1024)).toFixed(2);
    const indexSizeMB = (stats.indexSize / (1024 * 1024)).toFixed(2);
    const totalSizeMB = (stats.dataSize + stats.indexSize) / (1024 * 1024);
    
    // M0 cluster limit
    const M0_LIMIT_MB = 512;
    const usagePercent = ((totalSizeMB / M0_LIMIT_MB) * 100).toFixed(2);
    const remainingMB = (M0_LIMIT_MB - totalSizeMB).toFixed(2);
    
    console.log('💾 OVERALL DATABASE SIZE:\n');
    console.log(`  Data Size:     ${dbSizeMB} MB`);
    console.log(`  Storage Size:  ${storageSizeMB} MB`);
    console.log(`  Index Size:    ${indexSizeMB} MB`);
    console.log(`  Total Used:    ${totalSizeMB.toFixed(2)} MB`);
    console.log(`  M0 Limit:      ${M0_LIMIT_MB} MB`);
    console.log(`  Usage:         ${usagePercent}% (${remainingMB} MB remaining)`);
    
    // Visual progress bar
    const barLength = 50;
    const filledLength = Math.round((totalSizeMB / M0_LIMIT_MB) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    console.log(`  Progress:      [${bar}] ${usagePercent}%\n`);
    
    // Count documents by collection
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📋 DOCUMENT COUNTS BY COLLECTION:\n');
    
    const students = await ManagedStudent.countDocuments();
    const realStudents = await ManagedStudent.countDocuments({ 
      $or: [
        { isTestData: { $ne: true } },
        { isTestData: { $exists: false } }
      ]
    });
    const testStudents = await ManagedStudent.countDocuments({ isTestData: true });
    
    const grades = await Grade.countDocuments();
    const attendanceRecords = await AttendanceRecord.countDocuments();
    const attendanceSessions = await AttendanceSession.countDocuments();
    const payments = await PaymentHistory.countDocuments();
    const groups = await Group.countDocuments();
    const seasons = await Season.countDocuments();
    const admins = await Admin.countDocuments();
    
    console.log(`  Students:              ${students.toLocaleString()}`);
    console.log(`    - Real:              ${realStudents.toLocaleString()}`);
    console.log(`    - Test:              ${testStudents.toLocaleString()}`);
    console.log(`  Grades:                ${grades.toLocaleString()}`);
    console.log(`  Attendance Records:    ${attendanceRecords.toLocaleString()}`);
    console.log(`  Attendance Sessions:   ${attendanceSessions.toLocaleString()}`);
    console.log(`  Payments:              ${payments.toLocaleString()}`);
    console.log(`  Groups:                ${groups.toLocaleString()}`);
    console.log(`  Seasons:               ${seasons.toLocaleString()}`);
    console.log(`  Admins:                ${admins.toLocaleString()}`);
    
    const totalDocs = students + grades + attendanceRecords + attendanceSessions + payments + groups + seasons + admins;
    console.log(`  ─────────────────────────────────────────────────────`);
    console.log(`  TOTAL DOCUMENTS:       ${totalDocs.toLocaleString()}\n`);
    
    // Estimate size per collection
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📦 ESTIMATED SIZE BY COLLECTION:\n');
    
    const avgStudentSize = 1; // ~1 KB per student
    const avgGradeSize = 0.5; // ~0.5 KB per grade
    const avgAttendanceRecordSize = 0.5; // ~0.5 KB per record
    const avgAttendanceSessionSize = 0.5; // ~0.5 KB per session
    const avgPaymentSize = 0.5; // ~0.5 KB per payment
    
    const studentsSizeMB = (students * avgStudentSize / 1024).toFixed(2);
    const gradesSizeMB = (grades * avgGradeSize / 1024).toFixed(2);
    const attendanceRecordsSizeMB = (attendanceRecords * avgAttendanceRecordSize / 1024).toFixed(2);
    const attendanceSessionsSizeMB = (attendanceSessions * avgAttendanceSessionSize / 1024).toFixed(2);
    const paymentsSizeMB = (payments * avgPaymentSize / 1024).toFixed(2);
    
    console.log(`  Students:              ~${studentsSizeMB} MB (${students} × ~1 KB)`);
    console.log(`  Grades:                ~${gradesSizeMB} MB (${grades} × ~0.5 KB)`);
    console.log(`  Attendance Records:    ~${attendanceRecordsSizeMB} MB (${attendanceRecords} × ~0.5 KB)`);
    console.log(`  Attendance Sessions:   ~${attendanceSessionsSizeMB} MB (${attendanceSessions} × ~0.5 KB)`);
    console.log(`  Payments:              ~${paymentsSizeMB} MB (${payments} × ~0.5 KB)`);
    console.log(`  Other Collections:     ~${(totalSizeMB - parseFloat(studentsSizeMB) - parseFloat(gradesSizeMB) - parseFloat(attendanceRecordsSizeMB) - parseFloat(attendanceSessionsSizeMB) - parseFloat(paymentsSizeMB)).toFixed(2)} MB\n`);
    
    // Analysis and recommendations
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('💡 ANALYSIS & RECOMMENDATIONS:\n');
    
    if (usagePercent < 10) {
      console.log('  ✅ STATUS: Excellent - Very low usage');
      console.log('  📈 You can safely add much more data');
    } else if (usagePercent < 25) {
      console.log('  ✅ STATUS: Good - Low usage');
      console.log('  📈 Plenty of space available');
    } else if (usagePercent < 50) {
      console.log('  ⚠️  STATUS: Moderate - Medium usage');
      console.log('  📊 Monitor growth, consider cleanup of old test data');
    } else if (usagePercent < 75) {
      console.log('  ⚠️  STATUS: High - Approaching limit');
      console.log('  🧹 Recommend cleaning up test data and old records');
    } else {
      console.log('  🚨 STATUS: Critical - Very high usage');
      console.log('  🚨 URGENT: Clean up test data immediately');
      console.log('  🚨 Consider upgrading to M2 cluster (2 GB)');
    }
    
    console.log('');
    
    // Test data impact
    if (testStudents > 0) {
      const testGrades = await Grade.countDocuments({ isTestData: true });
      const testPayments = await PaymentHistory.countDocuments({ isTestData: true });
      const testGroups = await Group.countDocuments({ isTestData: true });
      
      const estimatedTestDataMB = (
        (testStudents * avgStudentSize / 1024) +
        (testGrades * avgGradeSize / 1024) +
        (testPayments * avgPaymentSize / 1024)
      ).toFixed(2);
      
      console.log('  🧪 TEST DATA IMPACT:\n');
      console.log(`     Students:  ${testStudents.toLocaleString()}`);
      console.log(`     Grades:    ${testGrades.toLocaleString()}`);
      console.log(`     Payments:  ${testPayments.toLocaleString()}`);
      console.log(`     Groups:    ${testGroups.toLocaleString()}`);
      console.log(`     Est. Size: ~${estimatedTestDataMB} MB`);
      console.log(`     Impact:    ~${((estimatedTestDataMB / totalSizeMB) * 100).toFixed(1)}% of total\n`);
      
      console.log('  💡 Run cleanup to free space:');
      console.log('     node scripts/cleanup-test-students.js\n');
    }
    
    // Old test data (without isTestData flag)
    const studentsWithNumberedEmails = await ManagedStudent.countDocuments({
      schoolEmail: { $regex: /\d+@nisrineschool\.com$/ }
    });
    
    if (studentsWithNumberedEmails > testStudents) {
      const oldTestStudents = studentsWithNumberedEmails - testStudents;
      console.log('  ⚠️  OLD TEST DATA DETECTED:\n');
      console.log(`     Students with numbered emails: ${studentsWithNumberedEmails.toLocaleString()}`);
      console.log(`     Flagged as test: ${testStudents.toLocaleString()}`);
      console.log(`     Unflagged (old): ${oldTestStudents.toLocaleString()}\n`);
      console.log('  💡 Clean old test data:');
      console.log('     node scripts/cleanup-by-email-pattern.js\n');
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error checking database size:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Database connection closed\n');
  }
}

// Run the check
checkDatabaseSize();
