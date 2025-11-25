// List All Students - View Current System Data
// Usage: node scripts/list-all-students.js
// This script shows ALL students currently in the system

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const ManagedStudent = require('../models/ManagedStudent');
const Group = require('../models/Group');
const Grade = require('../models/Grade');
const PaymentHistory = require('../models/PaymentHistory');

async function listAllStudents() {
  console.log('📋 CURRENT STUDENTS IN SYSTEM\n');
  
  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Get database stats
    const stats = await mongoose.connection.db.stats();
    const dbSize = (stats.dataSize / (1024 * 1024)).toFixed(2);
    console.log(`📊 Database size: ${dbSize} MB\n`);
    
    // Get all students
    const allStudents = await ManagedStudent.find({})
      .select('fullName formation groupName schoolEmail status isTestData createdAt')
      .sort({ createdAt: -1 });
    
    console.log(`👥 TOTAL STUDENTS: ${allStudents.length}\n`);
    
    if (allStudents.length === 0) {
      console.log('✅ No students found in the system.\n');
      await mongoose.disconnect();
      return;
    }
    
    // Group students by formation
    const byFormation = {};
    const byGroup = {};
    let testCount = 0;
    let realCount = 0;
    
    allStudents.forEach(student => {
      // Count by formation
      const formation = student.formation.join(', ') || 'No Formation';
      if (!byFormation[formation]) {
        byFormation[formation] = [];
      }
      byFormation[formation].push(student);
      
      // Count by group
      const group = student.groupName || 'No Group';
      if (!byGroup[group]) {
        byGroup[group] = [];
      }
      byGroup[group].push(student);
      
      // Count test vs real
      if (student.isTestData) {
        testCount++;
      } else {
        realCount++;
      }
    });
    
    // Display summary
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 SUMMARY BY FORMATION:\n');
    Object.keys(byFormation).sort().forEach(formation => {
      const students = byFormation[formation];
      const testStudents = students.filter(s => s.isTestData).length;
      const realStudents = students.length - testStudents;
      console.log(`${formation}:`);
      console.log(`  Total: ${students.length} students`);
      console.log(`  Real: ${realStudents} | Test: ${testStudents}\n`);
    });
    
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 SUMMARY BY GROUP:\n');
    Object.keys(byGroup).sort().forEach(group => {
      const students = byGroup[group];
      console.log(`${group}: ${students.length} students`);
    });
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('📊 TEST vs REAL DATA:\n');
    console.log(`Real Students: ${realCount}`);
    console.log(`Test Students: ${testCount}`);
    console.log(`Total: ${allStudents.length}\n`);
    
    // Get grades and payments count
    const gradesCount = await Grade.countDocuments();
    const paymentsCount = await PaymentHistory.countDocuments();
    
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 ASSOCIATED DATA:\n');
    console.log(`Total Grades: ${gradesCount}`);
    console.log(`Total Payments: ${paymentsCount}\n`);
    
    // Show detailed list
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📋 DETAILED STUDENT LIST:\n');
    
    // Group by formation for display
    Object.keys(byFormation).sort().forEach(formation => {
      console.log(`\n━━━ ${formation.toUpperCase()} ━━━\n`);
      
      const students = byFormation[formation];
      students.forEach((student, index) => {
        const testFlag = student.isTestData ? '🧪 TEST' : '✅ REAL';
        const status = student.status === 'active' ? '🟢' : '🔴';
        console.log(`${index + 1}. ${testFlag} ${status} ${student.fullName}`);
        console.log(`   Group: ${student.groupName || 'N/A'}`);
        console.log(`   Email: ${student.schoolEmail}`);
        console.log(`   Created: ${student.createdAt.toLocaleDateString()}\n`);
      });
    });
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Show groups
    const allGroups = await Group.find({}).select('name formation status isTestData currentStudentCount');
    console.log(`📋 TOTAL GROUPS: ${allGroups.length}\n`);
    
    if (allGroups.length > 0) {
      const testGroups = allGroups.filter(g => g.isTestData).length;
      const realGroups = allGroups.length - testGroups;
      
      console.log(`Real Groups: ${realGroups}`);
      console.log(`Test Groups: ${testGroups}\n`);
      
      console.log('Group List:\n');
      allGroups.forEach((group, index) => {
        const testFlag = group.isTestData ? '🧪 TEST' : '✅ REAL';
        const status = group.status === 'active' ? '🟢' : '🔴';
        console.log(`${index + 1}. ${testFlag} ${status} ${group.name} (${group.currentStudentCount} students)`);
      });
    }
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('💡 RECOMMENDATIONS:\n');
    
    if (testCount > 0) {
      console.log(`You have ${testCount} test students.`);
      console.log('To remove them: node scripts/cleanup-test-students.js\n');
    }
    
    if (realCount === 0 && testCount === 0) {
      console.log('Your system is empty. Ready for fresh data!');
      console.log('To generate test data: node scripts/generate-test-students.js\n');
    }
    
    if (realCount > 0) {
      console.log(`You have ${realCount} REAL students. These will be kept safe!`);
      console.log('Test data generation will add to these students.\n');
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error listing students:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Database connection closed\n');
  }
}

// Run the script
listAllStudents();
