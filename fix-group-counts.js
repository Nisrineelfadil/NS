// Script to fix group student counts to match actual database
const mongoose = require('mongoose');
require('dotenv').config();

const Group = require('./models/Group');
const ManagedStudent = require('./models/ManagedStudent');

async function fixGroupCounts() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nisrine-school');
        
        console.log('✅ Connected to MongoDB\n');
        console.log('🔧 Fixing group student counts...\n');
        
        // Get all groups
        const allGroups = await Group.find().sort({ name: 1 });
        
        let fixedCount = 0;
        
        for (const group of allGroups) {
            // Count actual students in this group
            const actualCount = await ManagedStudent.countDocuments({
                group: group._id,
                status: 'active'
            });
            
            const fieldCount = group.currentStudentCount || 0;
            
            if (actualCount !== fieldCount) {
                console.log(`📁 ${group.name}:`);
                console.log(`   Field shows: ${fieldCount}`);
                console.log(`   Database has: ${actualCount}`);
                
                // Update the field
                group.currentStudentCount = actualCount;
                await group.save();
                
                console.log(`   ✅ Fixed to: ${actualCount}\n`);
                fixedCount++;
            } else {
                console.log(`✅ ${group.name}: Already correct (${actualCount})`);
            }
        }
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ Fixed ${fixedCount} group(s)`);
        console.log(`✅ All group counts now match database reality!`);
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
        process.exit(0);
    }
}

fixGroupCounts();
