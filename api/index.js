// Vercel serverless function handler
const app = require('../server');

// Export the Express app directly for Vercel
// Vercel's @vercel/node builder knows how to handle Express apps
module.exports = app;
