// Vercel serverless function handler
console.log('🚀 Initializing Vercel serverless function...');

try {
  // Set environment variable to indicate serverless environment
  process.env.VERCEL = '1';
  
  // Load environment variables (optional - Vercel injects them automatically)
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not available in serverless - that's okay, Vercel injects env vars
    console.log('ℹ️ dotenv not available (expected in Vercel serverless)');
  }
  
  // Verify critical environment variables
  const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    console.error('Please configure these in Vercel dashboard: Settings > Environment Variables');
  } else {
    console.log('✅ All required environment variables are set');
  }
  
  // Import the Express app
  const app = require('../server');
  
  console.log('✅ Express app loaded successfully');
  console.log('📁 Current working directory:', process.cwd());
  console.log('📁 __dirname:', __dirname);
  
  // Log available files in root
  const fs = require('fs');
  const path = require('path');
  const rootFiles = fs.readdirSync(process.cwd()).filter(f => f.endsWith('.html'));
  console.log('📄 HTML files found:', rootFiles.join(', '));
  
  // Export the Express app directly for Vercel
  // Vercel's @vercel/node builder knows how to handle Express apps
  module.exports = app;
  
} catch (error) {
  console.error('❌ Failed to initialize serverless function:', error.message);
  console.error('Stack:', error.stack);
  
  // Export a minimal error handler
  module.exports = (req, res) => {
    res.status(500).json({
      error: 'Serverless function initialization failed',
      message: error.message,
      hint: 'Check Vercel function logs for details'
    });
  };
}
