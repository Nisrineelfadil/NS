/**
 * Check Groups Status
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Season = require('../models/Season');
const Group = require('../models/Group');

async function checkGroups() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');
        
        // Get all seasons
        const seasons = await Season.find();
        console.log('📅 Seasons:');
        seasons.forEach(s => {
            console.log(`   - ${s.name} (${s.status}) - ID: ${s._id}`);
        });
        console.log('');
        
        // Get all groups
        const groups = await Group.find();
        console.log(`📦 Total Groups: ${groups.length}\n`);
        
        groups.forEach(g => {
            console.log(`Group: ${g.name}`);
            console.log(`   Formation: ${g.formation}`);
            console.log(`   Group Type: ${g.groupType || 'NOT SET'}`);
            console.log(`   Season ID: ${g.season || 'NOT SET'}`);
            console.log(`   Season Name: ${g.seasonName || 'NOT SET'}`);
            console.log(`   Students: ${g.currentStudentCount || 0}`);
            console.log('');
        });
        
        await mongoose.disconnect();
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkGroups();
