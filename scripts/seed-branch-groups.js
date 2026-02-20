require('dotenv').config();
const mongoose = require('mongoose');
const BranchGroup = require('../models/BranchGroup');

async function seedBranchGroups() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const existing = await BranchGroup.countDocuments();
        console.log(`Existing branch groups: ${existing}`);

        if (existing > 0) {
            console.log('Branch groups already exist. Skipping seed.');
            process.exit(0);
        }

        const created = await BranchGroup.createDefaults(null, 'System');
        console.log(`Created ${created.length} default branch groups:`);
        created.forEach(bg => console.log(`  - ${bg.displayName} (${bg.formation})`));

        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

seedBranchGroups();
