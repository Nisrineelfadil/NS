// Script to update all existing groups to have branchFormation = "Mixed"
require('dotenv').config();
const mongoose = require('mongoose');
const Group = require('./models/Group');

async function updateGroups() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Update all groups to have branchFormation = "Mixed"
        const result = await Group.updateMany(
            {},
            { $set: { branchFormation: 'Mixed' } }
        );

        console.log(`✅ Updated ${result.modifiedCount} groups to have branchFormation = "Mixed"`);

        // Show all groups
        const allGroups = await Group.find({});
        console.log('\n📦 All Groups:');
        allGroups.forEach(group => {
            console.log(`  - ${group.name}: formation="${group.formation}", branchFormation="${group.branchFormation}"`);
        });

        mongoose.connection.close();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updateGroups();
