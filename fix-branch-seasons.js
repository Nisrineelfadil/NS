/**
 * Quick Fix: Assign Branch Subgroups to Active Season
 * 
 * This script fixes the issue where old branch subgroups appear in new seasons.
 * It assigns all branch subgroups without season data to the current active season.
 * 
 * Usage: node fix-branch-seasons.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixBranchSeasons() {
    try {
        console.log('🔧 Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected!\n');

        // Load models (they register themselves)
        const Season = require('./models/Season');
        const Group = require('./models/Group');
        const BranchGroup = require('./models/BranchGroup'); // Load BranchGroup model for populate

        // Find active season
        const activeSeason = await Season.findOne({ status: 'active' });
        
        if (!activeSeason) {
            console.log('❌ ERROR: No active season found!');
            console.log('   Please create an active season first, then run this script again.');
            process.exit(1);
        }

        console.log(`📅 Active Season Found: ${activeSeason.name}`);
        console.log(`   ID: ${activeSeason._id}`);
        console.log(`   Dates: ${activeSeason.startDate.toLocaleDateString()} - ${activeSeason.endDate.toLocaleDateString()}\n`);

        // Find branch subgroups without season
        const subgroupsToFix = await Group.find({
            groupType: 'branch',
            $or: [
                { season: { $exists: false } },
                { season: null }
            ]
        }).populate('branchGroup');

        console.log(`🔍 Found ${subgroupsToFix.length} branch subgroups without season data\n`);

        if (subgroupsToFix.length === 0) {
            console.log('✅ All branch subgroups already have season data!');
            console.log('   No migration needed. Your system is ready to go.');
            process.exit(0);
        }

        // Show what will be updated
        console.log('📋 Subgroups that will be updated:');
        console.log('─'.repeat(60));
        subgroupsToFix.forEach((sg, i) => {
            console.log(`${i + 1}. ${sg.name}`);
            console.log(`   Branch: ${sg.branchGroupName || 'Unknown'}`);
            console.log(`   Students: ${sg.currentStudentCount || 0}`);
            console.log('');
        });
        console.log('─'.repeat(60));
        console.log(`\n⚠️  These ${subgroupsToFix.length} subgroups will be assigned to: ${activeSeason.name}\n`);

        // Update all subgroups
        console.log('🚀 Starting migration...\n');
        let updated = 0;
        
        for (const subgroup of subgroupsToFix) {
            subgroup.season = activeSeason._id;
            subgroup.seasonName = activeSeason.name;
            await subgroup.save();
            updated++;
            console.log(`✅ [${updated}/${subgroupsToFix.length}] Updated: ${subgroup.name}`);
        }

        console.log('\n' + '═'.repeat(60));
        console.log('✅ MIGRATION COMPLETE!');
        console.log('═'.repeat(60));
        console.log(`\n📊 Summary:`);
        console.log(`   • Subgroups migrated: ${updated}`);
        console.log(`   • Assigned to season: ${activeSeason.name}`);
        console.log(`   • Season ID: ${activeSeason._id}`);
        
        console.log('\n📝 Next Steps:');
        console.log('   1. Restart your server: npm start');
        console.log('   2. Navigate to Seasons & Groups');
        console.log('   3. Select 2026-2027 season');
        console.log('   4. Check Branch Management tab');
        console.log('   5. You should now see the correct subgroups!\n');

    } catch (error) {
        console.error('\n❌ ERROR during migration:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed\n');
    }
}

// Run the fix
console.log('\n' + '═'.repeat(60));
console.log('🔧 BRANCH SEASON FIX - Migration Tool');
console.log('═'.repeat(60) + '\n');

fixBranchSeasons().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
