// Script to delete all branch grades without examType
require('dotenv').config();
const mongoose = require('mongoose');
const Grade = require('./models/Grade');

async function fixBranchGrades() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('✅ Connected to MongoDB');
        
        // Delete all branch grades (they're broken)
        const branchFormations = ['Gériatrie', 'Aide soignant', 'Agent socio éducatif', 'Assistante sociale', 'Restauration', 'Cuisine', 'Informatique', 'Gestion hôtelière'];
        
        const result = await Grade.deleteMany({
            formation: { $in: branchFormations }
        });
        
        console.log(`🗑️ Deleted ${result.deletedCount} branch grade(s)`);
        console.log('✅ Now you can add grades fresh!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixBranchGrades();
