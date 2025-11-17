/**
 * Migration Script: Assign Existing Branch Subgroups to Active Season
 * 
 * This script assigns all existing branch subgroups (Groups with groupType='branch')
 * that don't have a season to the current active season.
 * 
 * Run this ONCE after deploying the branch season fix.
 * 
 * Usage: node migrations/migrate-branch-subgroups-to-seasons.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Season = require('../models/Season');
const Group = require('../models/Group');

async function migrateBranchSubgroups() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find the active season
        const activeSeason = await Season.findOne({ status: 'active' });
        
        if (!activeSeason) {
            console.log('❌ No active season found. Please create an active season first.');
            process.exit(1);
        }

        console.log(`📅 Active Season: ${activeSeason.name} (${activeSeason._id})`);

        // Find all branch subgroups without a season
        const branchSubgroupsWithoutSeason = await Group.find({
            groupType: 'branch',
            $or: [
                { season: { $exists: false } },
                { season: null }
            ]
        });

        console.log(`\n🔍 Found ${branchSubgroupsWithoutSeason.length} branch subgroups without season data`);

        if (branchSubgroupsWithoutSeason.length === 0) {
            console.log('✅ All branch subgroups already have season data. No migration needed.');
            process.exit(0);
        }

        // Ask for confirmation
        console.log('\n⚠️  This will assign all these subgroups to the active season:');
        console.log(`   Season: ${activeSeason.name}`);
        console.log(`   Subgroups to update: ${branchSubgroupsWithoutSeason.length}`);
        console.log('\nSubgroups:');
        branchSubgroupsWithoutSeason.forEach((sg, index) => {
            console.log(`   ${index + 1}. ${sg.name} (${sg.branchGroupName})`);
        });

        // Update all subgroups
        let updated = 0;
        for (const subgroup of branchSubgroupsWithoutSeason) {
            subgroup.season = activeSeason._id;
            subgroup.seasonName = activeSeason.name;
            await subgroup.save();
            updated++;
            console.log(`✅ Updated: ${subgroup.name} -> ${activeSeason.name}`);
        }

        console.log(`\n✅ Migration complete! Updated ${updated} branch subgroups.`);
        console.log('\n📝 Summary:');
        console.log(`   - Total subgroups migrated: ${updated}`);
        console.log(`   - Assigned to season: ${activeSeason.name}`);
        console.log(`   - Season ID: ${activeSeason._id}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run migration
console.log('🚀 Starting Branch Subgroups Season Migration...\n');
migrateBranchSubgroups();
