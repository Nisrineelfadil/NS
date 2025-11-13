require('dotenv').config();
const mongoose = require('mongoose');
const Grade = require('../models/Grade');

async function checkTestNumbers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Find all language grades
        const languageGrades = await Grade.find({
            formation: { $in: ['Allemand', 'Anglais', 'Français', 'Ausbildung'] }
        }).select('formation examType languageLevel testType testNumber studentName score');
        
        console.log(`\n📊 Found ${languageGrades.length} language grades\n`);
        
        const gradesWithoutTestNumber = languageGrades.filter(g => 
            g.testType === 'miniTest' && !g.testNumber
        );
        
        const gradesWithTestNumber = languageGrades.filter(g => 
            g.testType === 'miniTest' && g.testNumber
        );
        
        console.log(`✅ Grades WITH testNumber: ${gradesWithTestNumber.length}`);
        console.log(`❌ Grades WITHOUT testNumber: ${gradesWithoutTestNumber.length}\n`);
        
        if (gradesWithTestNumber.length > 0) {
            console.log('📝 Sample grades WITH testNumber:');
            gradesWithTestNumber.slice(0, 5).forEach(g => {
                console.log(`  - ${g.studentName}: ${g.formation} ${g.examType} - Level: ${g.languageLevel}, TestType: ${g.testType}, TestNumber: ${g.testNumber}`);
            });
        }
        
        if (gradesWithoutTestNumber.length > 0) {
            console.log('\n⚠️  Sample grades WITHOUT testNumber:');
            gradesWithoutTestNumber.slice(0, 5).forEach(g => {
                console.log(`  - ${g.studentName}: ${g.formation} ${g.examType} - Level: ${g.languageLevel}, TestType: ${g.testType}, TestNumber: ${g.testNumber || 'MISSING'}`);
            });
            
            console.log(`\n🔧 To fix these grades, run: node scripts/fix-test-numbers.js`);
        }
        
        await mongoose.connection.close();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkTestNumbers();
