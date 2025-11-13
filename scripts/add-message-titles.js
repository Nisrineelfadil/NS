const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nisrine-school';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Import model
const StudentMessage = require('../models/StudentMessage');

async function addMessageTitles() {
    try {
        console.log('\n🔄 Adding titles to existing messages...\n');

        // Find all messages without a title
        const messages = await StudentMessage.find({
            $or: [
                { title: { $exists: false } },
                { title: null },
                { title: '' }
            ]
        });

        console.log(`📋 Found ${messages.length} message(s) without titles\n`);

        if (messages.length === 0) {
            console.log('✅ All messages already have titles!');
            return;
        }

        let updated = 0;

        for (const message of messages) {
            // Generate title based on type
            const title = {
                'payment': 'Payment Reminder',
                'reminder': 'Important Reminder',
                'info': 'Information',
                'announcement': 'Announcement',
                'notification': 'Notification',
                'alert': 'Alert'
            }[message.type] || 'Message';

            message.title = title;
            await message.save();
            updated++;
        }

        console.log(`✅ Migration complete! ${updated} message(s) updated with titles\n`);

    } catch (error) {
        console.error('❌ Migration error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

// Run migration
addMessageTitles();
