const webPush = require('web-push');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generating VAPID keys for push notifications...\n');

// Generate VAPID keys
const vapidKeys = webPush.generateVAPIDKeys();

console.log('✅ VAPID keys generated successfully!\n');
console.log('📋 Add these to your .env file:\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_CONTACT_EMAIL=admin@nisrineschool.com');
console.log('\n');

// Optionally save to a file
const envPath = path.join(__dirname, '..', '.env.vapid');
const envContent = `# VAPID Keys for Push Notifications
# Generated on: ${new Date().toISOString()}
# Add these to your main .env file

VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
VAPID_CONTACT_EMAIL=admin@nisrineschool.com
`;

fs.writeFileSync(envPath, envContent);
console.log(`💾 Keys also saved to: ${envPath}`);
console.log('⚠️  IMPORTANT: Keep the private key secret! Do not commit it to version control.\n');
