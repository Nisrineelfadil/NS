/**
 * Generate Dropbox Refresh Token
 * Run this script once to get a permanent refresh token
 */

const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Get these from your Dropbox App Console
const APP_KEY = process.env.DROPBOX_APP_KEY || 'x9zq5xe4cjsgaai';
const APP_SECRET = process.env.DROPBOX_APP_SECRET || 'sqj37g2200h3p4c';
const REDIRECT_URI = 'http://localhost:3000/auth/callback';

console.log('\n🔐 Dropbox Refresh Token Generator\n');
console.log('App Key:', APP_KEY);
console.log('App Secret:', APP_SECRET ? '***' + APP_SECRET.slice(-4) : 'NOT SET');
console.log('');

// Step 1: Visit this URL in browser
app.get('/auth', (req, res) => {
    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${APP_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code&token_access_type=offline`;
    console.log('📍 Redirecting to Dropbox authorization...');
    res.redirect(authUrl);
});

// Step 2: Dropbox redirects here with code
app.get('/auth/callback', async (req, res) => {
    const code = req.query.code;
    
    if (!code) {
        res.send('<h1>❌ Error</h1><p>No authorization code received</p>');
        return;
    }
    
    console.log('✅ Authorization code received');
    console.log('🔄 Exchanging code for tokens...');
    
    try {
        const response = await axios.post('https://api.dropboxapi.com/oauth2/token', null, {
            params: {
                code: code,
                grant_type: 'authorization_code',
                client_id: APP_KEY,
                client_secret: APP_SECRET,
                redirect_uri: REDIRECT_URI
            }
        });
        
        const accessToken = response.data.access_token;
        const refreshToken = response.data.refresh_token;
        const expiresIn = response.data.expires_in;
        
        console.log('\n✅ SUCCESS! Tokens received:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Access Token:', accessToken);
        console.log('Refresh Token:', refreshToken);
        console.log('Expires in:', expiresIn, 'seconds (', Math.floor(expiresIn / 3600), 'hours)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        console.log('📝 Add these to your .env file:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`DROPBOX_APP_KEY=${APP_KEY}`);
        console.log(`DROPBOX_APP_SECRET=${APP_SECRET}`);
        console.log(`DROPBOX_REFRESH_TOKEN=${refreshToken}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        console.log('⚠️  IMPORTANT:');
        console.log('   - The REFRESH TOKEN never expires!');
        console.log('   - Keep it secret and secure');
        console.log('   - You can remove DROPBOX_ACCESS_TOKEN from .env');
        console.log('   - The service will auto-refresh tokens as needed\n');
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Dropbox Token Generated</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 800px;
                        margin: 50px auto;
                        padding: 20px;
                        background: #f5f5f5;
                    }
                    .success {
                        background: #d4edda;
                        border: 1px solid #c3e6cb;
                        color: #155724;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                    }
                    .code-block {
                        background: #2d2d2d;
                        color: #f8f8f2;
                        padding: 20px;
                        border-radius: 8px;
                        font-family: 'Courier New', monospace;
                        overflow-x: auto;
                        margin: 20px 0;
                    }
                    .warning {
                        background: #fff3cd;
                        border: 1px solid #ffeeba;
                        color: #856404;
                        padding: 15px;
                        border-radius: 8px;
                        margin-top: 20px;
                    }
                    h1 { color: #155724; }
                    h2 { color: #333; margin-top: 30px; }
                    .token { 
                        word-break: break-all;
                        background: #f8f9fa;
                        padding: 10px;
                        border-radius: 4px;
                        margin: 10px 0;
                    }
                </style>
            </head>
            <body>
                <div class="success">
                    <h1>✅ Success! Dropbox Tokens Generated</h1>
                    <p>Your refresh token has been generated successfully.</p>
                </div>
                
                <h2>🔑 Your Tokens:</h2>
                <div class="token">
                    <strong>Access Token (expires in ${Math.floor(expiresIn / 3600)} hours):</strong><br>
                    <code>${accessToken}</code>
                </div>
                <div class="token">
                    <strong>Refresh Token (NEVER EXPIRES):</strong><br>
                    <code>${refreshToken}</code>
                </div>
                
                <h2>📝 Add to your .env file:</h2>
                <div class="code-block">
DROPBOX_APP_KEY=${APP_KEY}<br>
DROPBOX_APP_SECRET=${APP_SECRET}<br>
DROPBOX_REFRESH_TOKEN=${refreshToken}
                </div>
                
                <div class="warning">
                    <h3>⚠️ Important Security Notes:</h3>
                    <ul>
                        <li>The <strong>refresh token never expires</strong> - keep it secret!</li>
                        <li>You can now <strong>remove DROPBOX_ACCESS_TOKEN</strong> from your .env file</li>
                        <li>The service will automatically refresh access tokens as needed</li>
                        <li>Never commit your .env file to Git</li>
                        <li>You can close this window and stop the server (Ctrl+C)</li>
                    </ul>
                </div>
                
                <h2>✅ Next Steps:</h2>
                <ol>
                    <li>Copy the environment variables above to your .env file</li>
                    <li>Remove the old DROPBOX_ACCESS_TOKEN line</li>
                    <li>Restart your server</li>
                    <li>Test the connection in the admin panel</li>
                </ol>
            </body>
            </html>
        `);
        
        console.log('✅ You can now close this window and stop the server (Ctrl+C)\n');
        
    } catch (error) {
        console.error('\n❌ Error exchanging code for tokens:');
        console.error(error.response?.data || error.message);
        
        res.send(`
            <h1>❌ Error</h1>
            <p>Failed to exchange authorization code for tokens</p>
            <pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>
            <p>Check the console for more details</p>
        `);
    }
});

app.listen(3000, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Server running on http://localhost:3000');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📍 STEP 1: Open this URL in your browser:');
    console.log('   http://localhost:3000/auth\n');
    console.log('📍 STEP 2: Authorize the app in Dropbox');
    console.log('📍 STEP 3: Copy the refresh token to your .env file\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
