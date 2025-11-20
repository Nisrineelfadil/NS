const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import routes
const registrationRoutes = require('./routes/registration');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const servicesRoutes = require('./routes/services');
const adminRegistrationRoutes = require('./routes/adminRegistration');
const studentManagementRoutes = require('./routes/studentManagement');
const gradesRoutes = require('./routes/grades');
const attendanceRoutes = require('./routes/attendance');
const seasonsRoutes = require('./routes/seasons');
const branchGroupsRoutes = require('./routes/branchGroups');
const systemStatsRoutes = require('./routes/systemStats');
const adminActivityRoutes = require('./routes/adminActivity');
const cashRegisterRoutes = require('./routes/cashRegister');
const appointmentsRoutes = require('./routes/appointments');
const ratingsRoutes = require('./routes/ratings');
const notificationsRoutes = require('./routes/notifications');
const pushNotificationsRoutes = require('./routes/pushNotifications');

// Import services
const paymentReminderService = require('./services/paymentReminderService');
const attendanceService = require('./services/attendanceService');
const notificationService = require('./services/notificationService');
const pushService = require('./services/pushNotificationService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize HTTP server and Socket.IO
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Initialize notification service with Socket.IO
notificationService.initializeSocketIO(io);

// Initialize push notification service with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidContactEmail = process.env.VAPID_CONTACT_EMAIL || 'admin@nisrineschool.com';

if (vapidPublicKey && vapidPrivateKey) {
  pushService.initialize(vapidPublicKey, vapidPrivateKey, vapidContactEmail);
  console.log('✅ Push notification service initialized');
} else {
  console.warn('⚠️  VAPID keys not found. Push notifications will not work. Run: node scripts/generate-vapid-keys.js');
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ Admin client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('❌ Admin client disconnected:', socket.id);
  });
});

// Middleware
// Enhanced CORS for Electron desktop app support
app.use(cors({
  origin: '*', // Allow all origins (including Electron app and PWA)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma']
}));

// Additional headers for Electron app compatibility
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Remove X-Frame-Options to allow Electron to load the page
  res.removeHeader('X-Frame-Options');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json({ limit: '10mb' })); // Use express.json instead of body-parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Favicon handler - serve the actual favicon file (Vercel compatible)
app.get('/favicon.ico', (req, res) => {
  // Simply return 204 No Content for favicon in serverless
  // Vercel will serve it from static files if it exists
  res.status(204).end();
});

// Serve static files FIRST (before HTML routes and API routes)
const staticOptions = {
  maxAge: '1d', // Cache static files for 1 day
  etag: true,
  lastModified: true
};

// Use __dirname for Vercel serverless compatibility (files are bundled with the function)
const rootPath = __dirname;
app.use(express.static(path.join(rootPath, 'public'), staticOptions));
app.use('/uploads', express.static(path.join(rootPath, 'uploads'), staticOptions));
app.use('/css', express.static(path.join(rootPath, 'css'), staticOptions));
app.use('/js', express.static(path.join(rootPath, 'js'), staticOptions));
app.use('/Img', express.static(path.join(rootPath, 'Img'), staticOptions));
// Serve React app assets
app.use('/assets', express.static(path.join(rootPath, 'react-portals', 'dist', 'assets'), staticOptions));
// Serve PWA
app.use('/pwa', express.static(path.join(rootPath, 'pwa'), staticOptions));

// Helper function to serve HTML files (Vercel-compatible)
const serveHTML = (filename) => (req, res) => {
  // In Vercel serverless, use __dirname to get the correct path
  const filePath = path.join(__dirname, filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`Error serving ${filename}:`, err.message);
      console.error(`Attempted path: ${filePath}`);
      console.error(`__dirname: ${__dirname}`);
      console.error(`process.cwd(): ${process.cwd()}`);
      res.status(err.status || 500).send(`Error loading page: ${filename}`);
    }
  });
};

// Serve HTML files (after static files)
app.get('/', serveHTML('index.html'));
app.get('/index.html', serveHTML('index.html')); // Add explicit route for index.html
app.get('/register', serveHTML('register.html'));
app.get('/admin', serveHTML('admin.html'));
app.get('/my-registrations', serveHTML('my-registrations.html'));
app.get('/student-management', serveHTML('student-management.html'));
app.get('/cv.html', serveHTML('cv.html'));
app.get('/apply.html', serveHTML('apply.html'));
app.get('/translate.html', serveHTML('translate.html'));
app.get('/phase2-test', serveHTML('phase2-test.html'));
app.get('/login-app', serveHTML('app-redirect.html'));
app.get('/cash-register', serveHTML('cash-register.html'));

// Serve React portals (student and teacher)
app.get('/student-portal', (req, res) => {
  const filePath = path.join(process.cwd(), 'react-portals', 'dist', 'index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send('React app not built. Run: cd react-portals && npm run build');
    }
  });
});

app.get('/teacher-portal', (req, res) => {
  const filePath = path.join(process.cwd(), 'react-portals', 'dist', 'index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send('React app not built. Run: cd react-portals && npm run build');
    }
  });
});

// Serve PWA root
app.get('/pwa', (req, res) => {
  res.redirect('/pwa/');
});

app.get('/pwa/', (req, res) => {
  const filePath = path.join(rootPath, 'pwa', 'index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving PWA root:', err.message);
      res.status(404).send('PWA not built');
    }
  });
});

// Serve PWA - IMPORTANT: Only catch HTML routes, not static files
app.get(/^\/pwa\/.*/, (req, res, next) => {
  // Skip if it's a static file (has file extension)
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map|json)$/)) {
    return next();
  }
  
  const filePath = path.join(rootPath, 'pwa', 'index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving PWA:', err.message);
      res.status(404).send('PWA not built. Run: npm run build');
    }
  });
});

// Health check endpoint - NO DATABASE REQUIRED (must be before dbMiddleware)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Database connection middleware (only for API routes)
const dbMiddleware = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      error: 'Database connection failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// API Routes (with database connection)
app.use('/api', dbMiddleware, registrationRoutes);
app.use('/api/admin', dbMiddleware, adminRoutes);
app.use('/api/contact', dbMiddleware, contactRoutes);
app.use('/api/services', dbMiddleware, servicesRoutes);
app.use('/api/admin-registration', dbMiddleware, adminRegistrationRoutes);
app.use('/api/student-management', dbMiddleware, studentManagementRoutes);
app.use('/api/grades', dbMiddleware, gradesRoutes);
app.use('/api/attendance', dbMiddleware, attendanceRoutes);
app.use('/api/seasons', dbMiddleware, seasonsRoutes);
app.use('/api/branch-groups', dbMiddleware, branchGroupsRoutes);
app.use('/api/system-stats', dbMiddleware, systemStatsRoutes);
app.use('/api/admin-activity', dbMiddleware, adminActivityRoutes);
app.use('/api/cash-register', dbMiddleware, cashRegisterRoutes);
app.use('/api/appointments', dbMiddleware, appointmentsRoutes);
app.use('/api/ratings', dbMiddleware, ratingsRoutes);
app.use('/api/notifications', dbMiddleware, notificationsRoutes);
app.use('/api/push-notifications', dbMiddleware, pushNotificationsRoutes);

// PWA specific routes (explicit routes for PWA pages)
const servePWA = (req, res) => {
  const pwaIndexPath = path.join(__dirname, 'pwa', 'index.html');
  res.sendFile(pwaIndexPath, (err) => {
    if (err) {
      console.error('Error serving PWA index.html:', err.message);
      res.status(404).send('PWA not found');
    }
  });
};

app.get('/pwa', servePWA);
app.get('/pwa/', servePWA);
app.get('/pwa/login', servePWA);
app.get('/pwa/dashboard', servePWA);
app.get('/pwa/grades', servePWA);
app.get('/pwa/attendance', servePWA);
app.get('/pwa/payments', servePWA);
app.get('/pwa/messages', servePWA);
app.get('/pwa/settings', servePWA);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Page not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server (only if not in serverless environment)
if (require.main === module) {
  const HOST = '0.0.0.0'; // Listen on all interfaces
  const DISPLAY_HOST = '192.168.1.31';
  
  // Connect to database FIRST, then start server and services
  connectDB()
    .then(() => {
      console.log('✅ MongoDB connected successfully');
      
      server.listen(PORT, HOST, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}/`);
        console.log(`   Also available at http://${DISPLAY_HOST}:${PORT}/`);
        console.log('📝 Registration API available at /api/register');
        console.log('👥 Student Management available at /student-management');
        console.log('🎓 Student Portal available at /student-portal');
        console.log('👨\u200d🏫 Teacher Portal available at /teacher-portal');
        console.log('📱 Attendance API available at /api/attendance');
        console.log('Press Ctrl+C to stop the server');
        
        // Start services AFTER MongoDB is connected (only in local development)
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔧 Starting background services...');
          
          // Start payment reminder service (check every 60 minutes)
          paymentReminderService.start(60);
          
          // Start attendance service (check every 15 minutes)
          attendanceService.start(15);
          
          console.log('✅ Background services started');
        }
      });
    })
    .catch(err => {
      console.error('❌ Failed to connect to database:', err);
      console.error('Server will not start without database connection');
      process.exit(1);
    });
}

// Export for Vercel serverless
module.exports = app;
