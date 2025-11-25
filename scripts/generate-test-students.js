// Test Data Generator - 150 Students with Full Data
// Usage: node scripts/generate-test-students.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { generateMoroccanName, generateMoroccanPhone, generateFezAddress, getRandomElement } = require('./moroccan-names-database');

// Import models
const ManagedStudent = require('../models/ManagedStudent');
const Grade = require('../models/Grade');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSession = require('../models/AttendanceSession');
const PaymentHistory = require('../models/PaymentHistory');
const Group = require('../models/Group');
const Season = require('../models/Season');
const Admin = require('../models/Admin');

// Configuration
const CONFIG = {
  TOTAL_STUDENTS: 150,
  STUDENTS_PER_GROUP: 20,
  FORMATION: 'Allemand',
  GRADES_PER_STUDENT: { min: 20, max: 30 },
  ATTENDANCE_SESSIONS_PER_GROUP: 60, // ~3 sessions per week for 4 months
  PAYMENTS_PER_STUDENT: { min: 5, max: 10 },
  BATCH_SIZE: 10, // Reduced from 20 to 10 for multi-level grades
  TEST_BATCH_ID: 'demo-2024'
};

// German language levels and subjects
const LEVEL_PROGRESSION = {
  'A1': [],                    // No previous levels
  'A2': ['A1'],                // Has A1 history
  'B1': ['A1', 'A2'],          // Has A1 + A2 history
  'B2': ['A1', 'A2', 'B1']     // Has A1 + A2 + B1 history
};

// German language levels and subjects
const GERMAN_LEVELS = ['A1', 'A2', 'B1', 'B2'];
const GERMAN_SUBJECTS = ['Lesen', 'Hören', 'Schreiben', 'Sprechen']; // Only these 4 are allowed in Grade model

// Study levels
const STUDY_LEVELS = ['Bac', 'Bac+1', 'Bac+2', 'Bac+3', 'Bac+4', 'Bac+5', 'Professionnel'];

// Generate realistic CIN card (base64 placeholder)
function generateCINCard() {
  // In real scenario, this would be actual image data
  // For now, we'll create a small placeholder to save space
  const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return {
    front: placeholder,
    back: placeholder,
    uploadedAt: new Date()
  };
}

// Generate grades for a specific level with appropriate date range
function generateGradesForLevel(studentId, studentName, studentEmail, formation, groupId, groupName, admin, level, monthsAgo, baseScore) {
  const count = Math.floor(Math.random() * 3) + 5; // 5-7 grades per level
  const grades = [];
  
  // Current academic year
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const academicYear = month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  
  // Start date based on how many months ago this level was
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsAgo);
  
  for (let i = 0; i < count; i++) {
    const examType = getRandomElement(GERMAN_SUBJECTS);
    const testDate = new Date(startDate);
    testDate.setDate(testDate.getDate() + (i * 10)); // Tests every 10 days
    
    // Add some variation to scores (students improve over time)
    const improvement = (monthsAgo / 12) * 10; // Older levels = slightly lower scores
    const variation = (Math.random() - 0.5) * 15; // ±7.5 points
    const score = Math.max(0, Math.min(100, baseScore - improvement + variation));
    
    // Determine test type (mostly miniTests, some finalExams)
    const testType = Math.random() > 0.8 ? 'finalExam' : 'miniTest';
    const testNumber = testType === 'miniTest' ? Math.floor(Math.random() * 4) + 1 : undefined;
    
    grades.push({
      student: studentId,
      studentName: studentName,
      studentEmail: studentEmail,
      formation: formation, // String, not array
      group: groupId,
      groupName: groupName,
      examType: examType,
      score: parseFloat(score.toFixed(1)),
      maxScore: 100,
      languageLevel: level,
      testType: testType,
      testNumber: testNumber,
      examDate: testDate,
      academicYear: academicYear,
      comments: score >= 70 ? 'Très bien' : score >= 50 ? 'Bien' : 'À améliorer',
      uploadedBy: admin._id,
      uploadedByName: admin.username,
      uploadedByEmail: admin.email,
      isTestData: true
    });
  }
  
  return grades;
}

// Generate realistic grades with multi-level progression
function generateGrades(studentId, studentName, studentEmail, formation, groupId, groupName, admin) {
  const allGrades = [];
  
  // Determine student performance level (some are excellent, some average, some struggling)
  const performanceLevel = Math.random();
  let baseScore;
  if (performanceLevel > 0.7) {
    baseScore = 75; // Excellent student (75-100)
  } else if (performanceLevel > 0.3) {
    baseScore = 60; // Average student (50-75)
  } else {
    baseScore = 40; // Struggling student (25-60)
  }
  
  // Determine current language level from group name (e.g., "Allemand A1 - Groupe 1" -> "A1")
  const levelMatch = groupName.match(/(A1|A2|B1|B2)/);
  const currentLevel = levelMatch ? levelMatch[1] : 'A1';
  
  // Get previous levels for this student
  const previousLevels = LEVEL_PROGRESSION[currentLevel] || [];
  
  // Generate grades for previous levels (older dates)
  previousLevels.forEach((level, index) => {
    // Calculate months ago based on level progression
    // A1 for A2 student: 6-9 months ago
    // A1 for B1 student: 12-15 months ago
    // A2 for B1 student: 6-9 months ago
    const levelIndex = previousLevels.length - index;
    const monthsAgo = levelIndex * 6 + Math.floor(Math.random() * 3); // 6-9, 12-15, 18-21 months
    
    const levelGrades = generateGradesForLevel(
      studentId, studentName, studentEmail, formation, 
      groupId, groupName, admin, level, monthsAgo, baseScore
    );
    allGrades.push(...levelGrades);
  });
  
  // Generate grades for current level (recent dates, 0-4 months ago)
  const currentGrades = generateGradesForLevel(
    studentId, studentName, studentEmail, formation, 
    groupId, groupName, admin, currentLevel, Math.floor(Math.random() * 4), baseScore
  );
  allGrades.push(...currentGrades);
  
  return allGrades;
}

// Generate realistic attendance sessions for a group
function generateAttendanceSessions(group, admin) {
  const sessions = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 4); // Start 4 months ago
  
  // Generate sessions (Mon, Wed, Fri for 4 months)
  const sessionDays = [1, 3, 5]; // Monday, Wednesday, Friday
  let currentDate = new Date(startDate);
  
  while (sessions.length < CONFIG.ATTENDANCE_SESSIONS_PER_GROUP) {
    const dayOfWeek = currentDate.getDay();
    
    if (sessionDays.includes(dayOfWeek)) {
      // Class times: 9:00 AM - 11:00 AM
      const classStartTime = new Date(currentDate);
      classStartTime.setHours(9, 0, 0, 0);
      
      const classEndTime = new Date(currentDate);
      classEndTime.setHours(11, 0, 0, 0);
      
      const qrGeneratedAt = new Date(classStartTime);
      qrGeneratedAt.setMinutes(qrGeneratedAt.getMinutes() - 5); // QR generated 5 min before class
      
      const qrExpiresAt = new Date(classStartTime);
      qrExpiresAt.setMinutes(qrExpiresAt.getMinutes() + 10); // QR valid for 10 minutes
      
      sessions.push({
        groupId: group._id,
        groupName: group.name,
        teacherId: admin._id, // Using admin as teacher for test data
        teacherName: admin.username,
        formation: group.formation,
        date: new Date(currentDate),
        classStartTime: classStartTime,
        classEndTime: classEndTime,
        qrGeneratedAt: qrGeneratedAt,
        qrExpiresAt: qrExpiresAt,
        lateThresholdMinutes: 15,
        status: 'completed', // All past sessions are completed
        totalStudents: 0, // Will be updated when records are created
        presentCount: 0,
        lateCount: 0,
        absentCount: 0
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return sessions;
}

// Generate attendance records for a student across all sessions
function generateAttendanceRecords(studentId, studentName, studentEmail, groupId, groupName, formation, sessions, admin) {
  const records = [];
  
  // Determine student's attendance pattern (70-95% attendance rate)
  const attendanceRate = 0.7 + Math.random() * 0.25;
  const lateRate = 0.1; // 10% chance of being late when present
  
  sessions.forEach(session => {
    const willAttend = Math.random() < attendanceRate;
    let status = 'absent';
    let scanTime = null;
    
    if (willAttend) {
      const isLate = Math.random() < lateRate;
      status = isLate ? 'late' : 'present';
      
      // Generate realistic scan time
      if (status === 'present') {
        // Scan within QR validity period (before qrExpiresAt)
        scanTime = new Date(session.qrGeneratedAt);
        scanTime.setMinutes(scanTime.getMinutes() + Math.floor(Math.random() * 15)); // 0-15 min after QR generated
      } else {
        // Late scan (after qrExpiresAt but within late threshold)
        scanTime = new Date(session.qrExpiresAt);
        scanTime.setMinutes(scanTime.getMinutes() + Math.floor(Math.random() * 15)); // 0-15 min after expiry
      }
    }
    
    records.push({
      sessionId: session.sessionId,
      session: session._id,
      studentId: studentId,
      studentName: studentName,
      studentEmail: studentEmail,
      groupId: groupId,
      groupName: groupName,
      teacherId: admin._id,
      teacherName: admin.username,
      formation: formation,
      date: session.date,
      status: status,
      scanTime: scanTime,
      qrGeneratedAt: session.qrGeneratedAt,
      qrExpiresAt: session.qrExpiresAt,
      markedAbsentAutomatically: status === 'absent',
      notes: ''
    });
  });
  
  return records;
}

// Generate realistic payment history
function generatePayments(studentId, studentName, admin) {
  const count = Math.floor(Math.random() * (CONFIG.PAYMENTS_PER_STUDENT.max - CONFIG.PAYMENTS_PER_STUDENT.min + 1)) + CONFIG.PAYMENTS_PER_STUDENT.min;
  const payments = [];
  
  const monthlyFee = 800 + Math.floor(Math.random() * 400); // 800-1200 MAD
  
  // Academic year 2025-2026: September 2025 to August 2026
  // Start from September 2025
  const startDate = new Date(2025, 8, 1); // Month 8 = September (0-indexed)
  
  // Generate payments starting from September 2025
  for (let i = 0; i < count; i++) {
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + i);
    
    const markedAsPaidDate = new Date(paymentDate);
    markedAsPaidDate.setDate(markedAsPaidDate.getDate() + Math.floor(Math.random() * 3)); // Marked 0-3 days after payment
    
    payments.push({
      student: studentId,
      studentName: studentName,
      amount: monthlyFee,
      paymentDate: paymentDate,
      markedAsPaidDate: markedAsPaidDate,
      markedBy: admin._id,
      markedByName: admin.username,
      formation: [CONFIG.FORMATION],
      notes: `Paiement mensuel - ${CONFIG.FORMATION}`,
      isTestData: true
    });
  }
  
  return payments;
}

// Create test groups
async function createTestGroups(season, admin) {
  console.log('\n📋 Creating test groups...');
  
  // First, delete any existing test groups AND any Allemand groups to avoid duplicates
  const existingTestGroups = await Group.countDocuments({ isTestData: true });
  const existingAllemandGroups = await Group.countDocuments({ 
    name: { $regex: /^Allemand/, $options: 'i' } 
  });
  
  if (existingTestGroups > 0 || existingAllemandGroups > 0) {
    console.log(`⚠️  Found ${existingTestGroups} test groups and ${existingAllemandGroups} Allemand groups. Deleting them...`);
    await Group.deleteMany({ 
      $or: [
        { isTestData: true },
        { name: { $regex: /^Allemand/, $options: 'i' } }
      ]
    });
    console.log(`✅ Deleted all existing test/Allemand groups\n`);
  }
  
  const groups = [];
  const groupsPerLevel = Math.ceil(CONFIG.TOTAL_STUDENTS / CONFIG.STUDENTS_PER_GROUP / GERMAN_LEVELS.length);
  
  for (const level of GERMAN_LEVELS) {
    for (let i = 1; i <= groupsPerLevel; i++) {
      const group = new Group({
        name: `${CONFIG.FORMATION} ${level} - Groupe ${i}`,
        formation: CONFIG.FORMATION,
        groupType: 'language',
        maxStudents: CONFIG.STUDENTS_PER_GROUP,
        currentStudentCount: 0,
        status: 'active',
        season: season._id,
        seasonName: season.name,
        createdBy: admin._id,
        createdByName: admin.username,
        isTestData: true,
        testBatch: CONFIG.TEST_BATCH_ID
      });
      
      await group.save();
      groups.push(group);
      console.log(`✅ Created group: ${group.name}`);
    }
  }
  
  return groups;
}

// Generate a single test student
async function generateStudent(index, groups, admin) {
  const nameData = generateMoroccanName();
  const phone = generateMoroccanPhone();
  const parentPhone = generateMoroccanPhone(); // Different parent phone
  const address = generateFezAddress();
  
  // Assign to group (round-robin)
  const groupIndex = Math.floor(index / CONFIG.STUDENTS_PER_GROUP) % groups.length;
  const group = groups[groupIndex];
  
  // Generate birth date (18-35 years old)
  const birthDate = new Date();
  birthDate.setFullYear(birthDate.getFullYear() - (18 + Math.floor(Math.random() * 17)));
  birthDate.setMonth(Math.floor(Math.random() * 12));
  birthDate.setDate(Math.floor(Math.random() * 28) + 1);
  
  // Generate CIN number (Moroccan ID format)
  const cinNumber = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                    Math.floor(100000 + Math.random() * 900000);
  
  // Generate school email (@nisrineschool.com)
  const schoolEmail = `${nameData.firstName.toLowerCase()}.${nameData.lastName.toLowerCase()}${index}@nisrineschool.com`;
  
  // Generate email password (simple for test)
  const emailPassword = `Test${index}@2024`;
  
  // Hash password (default: "test123")
  const hashedPassword = await bcrypt.hash('test123', 10);
  
  // Payment date (random in last 30 days)
  const paymentDate = new Date();
  paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 30));
  
  // Payment amount (800-1200 MAD)
  const paymentAmount = 800 + Math.floor(Math.random() * 400);
  
  const student = new ManagedStudent({
    fullName: nameData.fullName,
    phoneNumber: phone,
    parentPhone: parentPhone,
    schoolEmail: schoolEmail,
    emailPassword: emailPassword,
    plainTextPassword: 'test123',
    dateOfBirth: birthDate,
    address: address.fullAddress,
    city: 'Fès',
    cin: cinNumber,
    formation: [CONFIG.FORMATION], // Array format
    studyLevel: getRandomElement(STUDY_LEVELS),
    group: group._id,
    groupName: group.name,
    cinCard: generateCINCard(),
    paymentDate: paymentDate,
    paymentAmount: paymentAmount,
    paymentStatus: Math.random() > 0.2 ? 'paid' : 'pending',
    status: 'active',
    addedBy: admin._id,
    addedByName: admin.username,
    isTestData: true,
    testBatch: CONFIG.TEST_BATCH_ID
  });
  
  return student;
}

// Main generation function
async function generateTestData() {
  console.log('🚀 Starting test data generation...\n');
  console.log(`Configuration:`);
  console.log(`  - Total students: ${CONFIG.TOTAL_STUDENTS}`);
  console.log(`  - Students per group: ${CONFIG.STUDENTS_PER_GROUP}`);
  console.log(`  - Formation: ${CONFIG.FORMATION}`);
  console.log(`  - Batch size: ${CONFIG.BATCH_SIZE}`);
  console.log(`  - Test batch ID: ${CONFIG.TEST_BATCH_ID}\n`);
  
  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Check current database size
    const stats = await mongoose.connection.db.stats();
    const currentSizeMB = (stats.dataSize / (1024 * 1024)).toFixed(2);
    console.log(`📊 Current database size: ${currentSizeMB} MB\n`);
    
    // Get active season
    console.log('🔍 Finding active season...');
    let season = await Season.getCurrentSeason();
    if (!season) {
      console.log('⚠️  No active season found. Creating a test season...');
      // Get first admin to create season
      const firstAdmin = await Admin.findOne();
      if (!firstAdmin) {
        throw new Error('No admin found in database. Please create an admin first.');
      }
      // Create a test season for current year
      const currentYear = new Date().getFullYear();
      season = await Season.createFromYear(currentYear, firstAdmin._id, firstAdmin.username);
      await season.updateOne({ status: 'active' });
      console.log(`✅ Created and activated season: ${season.name}`);
    } else {
      console.log(`✅ Using active season: ${season.name}`);
    }
    
    // Get an admin for group creation
    console.log('🔍 Finding admin...');
    const admin = await Admin.findOne();
    if (!admin) {
      throw new Error('No admin found in database. Please create an admin first.');
    }
    console.log(`✅ Using admin: ${admin.username}\n`);
    
    // Create test groups
    const groups = await createTestGroups(season, admin);
    console.log(`\n✅ Created ${groups.length} test groups\n`);
    
    // Generate attendance sessions for all groups
    console.log('📅 Generating attendance sessions for groups...\n');
    const allSessions = [];
    const groupSessionsMap = new Map(); // Map groupId -> sessions array
    
    for (const group of groups) {
      const sessions = generateAttendanceSessions(group, admin);
      
      // Save sessions to database and store references
      const savedSessions = await AttendanceSession.insertMany(sessions);
      allSessions.push(...savedSessions);
      groupSessionsMap.set(group._id.toString(), savedSessions);
      
      console.log(`  ✓ Created ${savedSessions.length} sessions for ${group.name}`);
    }
    
    console.log(`\n✅ Created ${allSessions.length} total attendance sessions\n`);
    
    // Generate students in batches
    console.log('👥 Generating students...\n');
    let totalStudents = 0;
    let totalGrades = 0;
    let totalAttendance = 0;
    let totalPayments = 0;
    
    for (let batch = 0; batch < Math.ceil(CONFIG.TOTAL_STUDENTS / CONFIG.BATCH_SIZE); batch++) {
      const batchStart = batch * CONFIG.BATCH_SIZE;
      const batchEnd = Math.min(batchStart + CONFIG.BATCH_SIZE, CONFIG.TOTAL_STUDENTS);
      const batchSize = batchEnd - batchStart;
      
      console.log(`📦 Processing batch ${batch + 1} (students ${batchStart + 1}-${batchEnd})...`);
      
      // Collect all grades, payments, and attendance records for batch insert
      const batchGrades = [];
      const batchPayments = [];
      const batchAttendanceRecords = [];
      
      for (let i = batchStart; i < batchEnd; i++) {
        // Generate student
        const student = await generateStudent(i, groups, admin);
        await student.save();
        totalStudents++;
        
        // Collect grades (don't insert yet)
        const grades = generateGrades(
          student._id, 
          student.fullName, 
          student.schoolEmail, 
          student.formation[0], // Get first element from array
          student.group, 
          student.groupName,
          admin
        );
        batchGrades.push(...grades);
        
        // Collect payments (don't insert yet)
        const payments = generatePayments(student._id, student.fullName, admin);
        batchPayments.push(...payments);
        
        // Collect attendance records (don't insert yet)
        const groupSessions = groupSessionsMap.get(student.group.toString());
        if (groupSessions && groupSessions.length > 0) {
          const attendanceRecords = generateAttendanceRecords(
            student._id,
            student.fullName,
            student.schoolEmail,
            student.group,
            student.groupName,
            student.formation[0],
            groupSessions,
            admin
          );
          batchAttendanceRecords.push(...attendanceRecords);
        }
        
        // Progress indicator
        if ((i + 1) % 10 === 0) {
          process.stdout.write(`  ✓ ${i + 1}/${CONFIG.TOTAL_STUDENTS} students created\r`);
        }
      }
      
      // Insert all grades for this batch at once (more efficient)
      if (batchGrades.length > 0) {
        console.log(`\n  📝 Inserting ${batchGrades.length} grades for batch ${batch + 1}...`);
        await Grade.insertMany(batchGrades, { ordered: false });
        totalGrades += batchGrades.length;
      }
      
      // Insert all payments for this batch at once
      if (batchPayments.length > 0) {
        console.log(`  💰 Inserting ${batchPayments.length} payments for batch ${batch + 1}...`);
        await PaymentHistory.insertMany(batchPayments, { ordered: false });
        totalPayments += batchPayments.length;
      }
      
      // Insert all attendance records for this batch at once
      if (batchAttendanceRecords.length > 0) {
        console.log(`  📋 Inserting ${batchAttendanceRecords.length} attendance records for batch ${batch + 1}...`);
        await AttendanceRecord.insertMany(batchAttendanceRecords, { ordered: false });
        totalAttendance += batchAttendanceRecords.length;
      }
      
      console.log(`  ✅ Batch ${batch + 1} completed (${batchSize} students)\n`);
      
      // Check database size after each batch
      const batchStats = await mongoose.connection.db.stats();
      const batchSizeMB = (batchStats.dataSize / (1024 * 1024)).toFixed(2);
      console.log(`  📊 Database size: ${batchSizeMB} MB\n`);
    }
    
    // Final statistics
    const finalStats = await mongoose.connection.db.stats();
    const finalSizeMB = (finalStats.dataSize / (1024 * 1024)).toFixed(2);
    const addedSizeMB = (finalSizeMB - currentSizeMB).toFixed(2);
    
    console.log('\n✨ Test data generation completed!\n');
    console.log('📊 Summary:');
    console.log(`  - Students created: ${totalStudents}`);
    console.log(`  - Groups created: ${groups.length}`);
    console.log(`  - Grades created: ${totalGrades}`);
    console.log(`  - Attendance records: ${totalAttendance}`);
    console.log(`  - Payment records: ${totalPayments}`);
    console.log(`  - Total documents: ${totalStudents + groups.length + totalGrades + totalAttendance + totalPayments}`);
    console.log(`\n💾 Database size:`);
    console.log(`  - Before: ${currentSizeMB} MB`);
    console.log(`  - After: ${finalSizeMB} MB`);
    console.log(`  - Added: ${addedSizeMB} MB`);
    console.log(`  - Capacity used: ${((finalSizeMB / 512) * 100).toFixed(1)}% of 512 MB\n`);
    
    console.log('✅ All test data generated successfully!');
    console.log('\n📝 Default login credentials for test students:');
    console.log('   School Email: [firstname].[lastname][number]@nisrineschool.com');
    console.log('   Password: test123');
    console.log('   Email Password: Test[number]@2024\n');
    console.log('⚠️  Remember to run cleanup script after demo:');
    console.log('   node scripts/cleanup-test-students.js\n');
    
  } catch (error) {
    console.error('\n❌ Error generating test data:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  generateTestData()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { generateTestData };
