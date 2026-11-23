const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
    // Return existing connection if already connected
    if (isConnected && mongoose.connection.readyState === 1) {
        console.log('✅ Using existing MongoDB connection');
        return mongoose.connection;
    }

    // Return existing connection attempt if in progress
    if (connectionPromise) {
        console.log('⏳ Waiting for existing connection attempt...');
        return connectionPromise;
    }

    try {
        console.log('🔄 Connecting to MongoDB...');
        
        // Check if MONGODB_URI exists
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not defined');
        }
        // CFG-03: outside production, never connect to a remote (possibly production) database by accident
        const target = require('./environment').assertDatabaseAllowed(process.env.MONGODB_URI, 'server');
        console.log(`🗄️  Database: ${target.location}${target.name ? ' / ' + target.name : ''} (NODE_ENV=${process.env.NODE_ENV || 'unset'})`);

        // Create connection promise
        connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 10000, // Increased for serverless cold starts
            socketTimeoutMS: 45000,
            family: 4,
            // Serverless-friendly options
            bufferCommands: false, // Disable mongoose buffering
            autoIndex: false // Don't build indexes in production
        });
        
        const db = await connectionPromise;
        
        isConnected = db.connections[0].readyState === 1;
        console.log('✅ MongoDB Connected Successfully!');
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
            isConnected = false;
            connectionPromise = null;
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
            isConnected = false;
            connectionPromise = null;
        });
        
        return db.connections[0];
        
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        isConnected = false;
        connectionPromise = null;
        throw error;
    }
};

module.exports = connectDB;
