const mongoose = require('mongoose');

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        console.log('🔍 Testing database connection...');
        console.log('Environment check:');
        console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
        console.log('- MONGODB_URI length:', process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0);
        console.log('- JWT_SECRET exists:', !!process.env.JWT_SECRET);
        
        // Log the connection string (without password for security)
        if (process.env.MONGODB_URI) {
            const uriWithoutPassword = process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@');
            console.log('- Connection string format:', uriWithoutPassword);
        }

        // Test MongoDB connection
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        // Close existing connection if any
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        console.log('🔌 Attempting to connect to MongoDB...');
        
        const connection = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // 10 second timeout
            connectTimeoutMS: 10000,
        });

        console.log('✅ MongoDB connection successful!');
        console.log('- Connection state:', mongoose.connection.readyState);
        console.log('- Database name:', mongoose.connection.name);
        console.log('- Host:', mongoose.connection.host);

        // Test a simple query
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('- Available collections:', collections.map(c => c.name));

        res.status(200).json({
            success: true,
            message: 'Database connection successful!',
            details: {
                connectionState: mongoose.connection.readyState,
                databaseName: mongoose.connection.name,
                host: mongoose.connection.host,
                collections: collections.map(c => c.name),
                environmentVariables: {
                    mongodbUri: !!process.env.MONGODB_URI,
                    jwtSecret: !!process.env.JWT_SECRET,
                    port: process.env.PORT || 'not set'
                }
            }
        });

    } catch (error) {
        console.error('❌ Database connection failed:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            codeName: error.codeName
        });

        res.status(500).json({
            success: false,
            error: 'Database connection failed',
            details: {
                name: error.name,
                message: error.message,
                code: error.code,
                codeName: error.codeName,
                environmentCheck: {
                    mongodbUri: !!process.env.MONGODB_URI,
                    mongodbUriLength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
                    jwtSecret: !!process.env.JWT_SECRET
                }
            }
        });
    }
}
