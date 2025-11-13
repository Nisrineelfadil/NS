// Script to delete the problematic grade document
require('dotenv').config();
const mongoose = require('mongoose');
const Grade = require('./models/Grade');

async function deleteBadGrade() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Delete the grade that has no branchGrades
        const result = await Grade.deleteMany({
            formation: 'Informatique',
            examType: null,
            branchGrades: { $exists: false }
        });
        
        console.log(`🗑️ Deleted ${result.deletedCount} bad grade(s)`);
        
        // Also delete any grades with empty branchGrades
        const result2 = await Grade.deleteMany({
            formation: 'Informatique',
            examType: null,
            $or: [
                { branchGrades: null },
                { branchGrades: {} }
            ]
        });
        
        console.log(`🗑️ Deleted ${result2.deletedCount} empty grade(s)`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

deleteBadGrade();
