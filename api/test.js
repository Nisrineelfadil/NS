// Ultra-minimal test - NO dependencies
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify({
    status: 'ALIVE',
    timestamp: new Date().toISOString(),
    env: {
      MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV || 'not set'
    }
  }, null, 2));
};
