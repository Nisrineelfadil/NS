/**
 * Script to check exam number distribution in the database
 * Run with: node scripts/check-exam-distribution.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Grade = require('../models/Grade');

async function checkExamDistribution() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get all grades
        const allGrades = await Grade.find({})
            .select('student formation examType examNumber semester academicYear')
            .lean();

        console.log(`\n📊 Total grades in database: ${allGrades.length}`);

        // Group by exam number
        const byExam = {};
        allGrades.forEach(grade => {
            const examNum = grade.examNumber || 1;
            if (!byExam[examNum]) byExam[examNum] = [];
            byExam[examNum].push(grade);
        });

        console.log('\n📈 Distribution by Exam Number:');
        Object.keys(byExam).sort().forEach(examNum => {
            console.log(`  Exam ${examNum}: ${byExam[examNum].length} grades`);
        });

        // Check for duplicates (same student, formation, examType, semester, but different examNumber)
        console.log('\n🔍 Checking for potential duplicates...');
        const gradeMap = new Map();
        let duplicates = 0;

        allGrades.forEach(grade => {
            const key = `${grade.student}-${grade.formation}-${grade.examType}-${grade.semester}-${grade.academicYear}`;
            if (!gradeMap.has(key)) {
                gradeMap.set(key, []);
            }
            gradeMap.get(key).push(grade.examNumber);
        });

        gradeMap.forEach((examNumbers, key) => {
            if (examNumbers.length > 1) {
                duplicates++;
                console.log(`  ⚠️  ${key}: appears in exams ${examNumbers.join(', ')}`);
            }
        });

        if (duplicates === 0) {
            console.log('  ✅ No duplicates found - each grade is unique per exam');
        } else {
            console.log(`  ⚠️  Found ${duplicates} sets of grades appearing in multiple exams`);
        }

        // Sample a few grades to show structure
        console.log('\n📝 Sample grades:');
        const samples = allGrades.slice(0, 5);
        samples.forEach(grade => {
            console.log(`  - Student: ${grade.student}, Formation: ${grade.formation}, ExamType: ${grade.examType}, Exam: ${grade.examNumber}, Semester: ${grade.semester}`);
        });

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkExamDistribution();
