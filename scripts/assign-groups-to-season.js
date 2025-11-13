/**
 * Assign Existing Groups to Current Season
 * 
 * This script assigns all existing groups without a season to the current active season
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Season = require('../models/Season');
const Group = require('../models/Group');

async function assignGroupsToSeason() {
    try {
        console.log('🚀 Starting group-to-season assignment...\n');
        
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');
        
        // Get the current active season
        const activeSeason = await Season.findOne({ status: 'active' });
        
        if (!activeSeason) {
            console.log('❌ No active season found. Please create or activate a season first.');
            process.exit(1);
        }
        
        console.log(`📅 Found active season: ${activeSeason.name}\n`);
        
        // Find all groups without a season
        const groupsWithoutSeason = await Group.find({
            $or: [
                { season: { $exists: false } },
                { season: null }
            ]
        });
        
        console.log(`📦 Found ${groupsWithoutSeason.length} groups without a season\n`);
        
        if (groupsWithoutSeason.length === 0) {
            console.log('✅ All groups are already assigned to seasons!');
            process.exit(0);
        }
        
        // Assign each group to the active season
        let updated = 0;
        for (const group of groupsWithoutSeason) {
            group.season = activeSeason._id;
            group.seasonName = activeSeason.name;
            
            // Set groupType if not already set
            if (!group.groupType) {
                // Determine if it's a language or branch group
                const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung', 'Mixed'];
                group.groupType = languageFormations.includes(group.formation) ? 'language' : 'branch';
            }
            
            await group.save();
            console.log(`   ✅ Assigned "${group.name}" to ${activeSeason.name} (${group.groupType})`);
            updated++;
        }
        
        console.log(`\n✅ Successfully assigned ${updated} groups to ${activeSeason.name}!`);
        console.log('\n' + '='.repeat(60));
        console.log('🎉 Assignment Complete!');
        console.log('='.repeat(60));
        
        // Disconnect
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from database');
        
    } catch (error) {
        console.error('❌ Error during assignment:', error);
        process.exit(1);
    }
}

// Run the script
assignGroupsToSeason();
