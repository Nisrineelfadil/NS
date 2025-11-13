// Debug endpoint - test modules step by step
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  // Test 1: Environment
  results.tests.env = {
    MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'MISSING ❌',
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING ❌',
    NODE_ENV: process.env.NODE_ENV || 'not set'
  };

  // Test 2: Can we require basic modules?
  try {
    require('express');
    results.tests.express = 'OK ✅';
  } catch (e) {
    results.tests.express = 'FAILED ❌: ' + e.message;
  }

  try {
    require('mongoose');
    results.tests.mongoose = 'OK ✅';
  } catch (e) {
    results.tests.mongoose = 'FAILED ❌: ' + e.message;
  }

  // Test 3: Can we load config?
  try {
    require('../config/database');
    results.tests.database_config = 'OK ✅';
  } catch (e) {
    results.tests.database_config = 'FAILED ❌: ' + e.message;
  }

  // Test 4: Can we load server.js?
  try {
    require('../server');
    results.tests.server_js = 'OK ✅';
  } catch (e) {
    results.tests.server_js = 'FAILED ❌: ' + e.message;
    results.tests.server_js_stack = e.stack;
  }

  res.status(200).send(JSON.stringify(results, null, 2));
};
