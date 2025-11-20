# 🎓 Nisrine School - Complete Management System

**Comprehensive School Management Platform with Web & Mobile Applications**

A full-featured school management system for Nisrine School in Fez, Morocco. Includes student registration, grades management, attendance tracking, payment monitoring, messaging system, and mobile applications for students.

**Version:** 1.0.1  
**Last Updated:** October 2025  
**Platform:** Web (Admin/Teachers) + Mobile (Students)

---

## 📋 Table of Contents

1. [System Overview](#-system-overview)
2. [Core Features](#-core-features)
3. [Module Details](#-module-details)
4. [User Roles & Permissions](#-user-roles--permissions)
5. [Technologies](#-technologies-used)
6. [Project Structure](#-project-structure)
7. [Installation](#-installation)
8. [API Documentation](#-api-documentation)
9. [Mobile Apps](#-mobile-applications)
10. [Security](#-security-features)
11. [Deployment](#-deployment)

---

## 🌟 System Overview

### **What is Nisrine School Management System?**

A complete, integrated platform that manages every aspect of school operations:

- 📝 **Student Registration** - Online registration with PDF generation
- 👥 **Student Management** - Complete student database with groups and formations
- 📊 **Grades Management** - Multi-formation grading system with exam types
- 📅 **Attendance Tracking** - QR code-based attendance with real-time monitoring
- 💰 **Payment Monitoring** - Track payments with automatic reminders
- 📧 **Messaging System** - School-wide announcements and notifications
- 👨‍🏫 **Teacher Portal** - Grade upload and attendance management
- 📱 **Mobile Apps** - Student portal for Android and iOS (PWA)
- 🎨 **Theme System** - Dark/Light mode support
- 🌐 **Multi-language** - Arabic, French, English support

---

## 🎯 Core Features

### **1. Public Website**
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Multilingual support (AR/FR/EN)
- ✅ Student image slider
- ✅ Course information
- ✅ Contact information
- ✅ Modern UI with animations

### **2. Student Registration System**
- ✅ Online registration form
- ✅ Photo upload (5MB max)
- ✅ Multiple formation selection (languages + branches)
- ✅ Multiple filière selection
- ✅ Automatic PDF generation
- ✅ Google Drive backup
- ✅ Local backup system
- ✅ Email auto-generation (@nisrineschool.com)
- ✅ Password generation
- ✅ Registration open/close toggle
- ✅ Custom closed message

### **3. Student Management (Admin)**
- ✅ Complete student database
- ✅ Group assignment
- ✅ Formation management (languages + branches)
- ✅ Status tracking (active/inactive)
- ✅ Payment status monitoring
- ✅ Photo management
- ✅ School email management
- ✅ Password reset
- ✅ Bulk operations
- ✅ Search and filters
- ✅ CSV export
- ✅ Card-based design
- ✅ Visual payment indicators

### **4. Grades Management System**
- ✅ Multi-formation support (12 formations)
- ✅ Language formations: Allemand, Anglais, Français, Ausbildung
- ✅ Branch formations: Informatique, Gériatrie, Aide soignant, etc.
- ✅ 4 exam types per language: Lesen, Hören, Schreiben, Sprechen
- ✅ 5 module types per branch
- ✅ Semester system (Semester 1 & 2)
- ✅ Academic year tracking
- ✅ Grade statistics and analytics
- ✅ Color-coded grade letters (A-F)
- ✅ Teacher-specific grade upload
- ✅ Edit/delete own grades
- ✅ Student portal for viewing grades
- ✅ Parent access
- ✅ Filter by formation, semester, exam
- ✅ Average score calculation

### **5. Attendance System**
- ✅ QR code generation by teachers
- ✅ Time-limited QR codes (customizable duration)
- ✅ Student QR scanning via mobile app
- ✅ Real-time attendance tracking
- ✅ Automatic absent marking
- ✅ Late arrival detection
- ✅ Attendance history
- ✅ Admin monitoring dashboard
- ✅ Statistics (present, late, absent)
- ✅ Filter by group, formation, date
- ✅ Excel export
- ✅ Cancel session feature
- ✅ Clear absence history
- ✅ Bulk absence clearing

### **6. Payment Management**
- ✅ Payment date tracking
- ✅ Payment amount (MAD currency)
- ✅ Payment status (Paid, Pending, Overdue)
- ✅ Automatic payment reminders
- ✅ Reminder service (runs every 60 minutes)
- ✅ Customizable reminder days (default: 7 days before)
- ✅ Visual indicators (red bell for overdue)
- ✅ Dashboard statistics
- ✅ Payment history
- ✅ Mark as paid feature
- ✅ Mobile app payment view

### **7. Messaging System**
- ✅ School-wide announcements
- ✅ Targeted messages (by group/formation)
- ✅ Message titles and content
- ✅ Timestamp tracking
- ✅ Read/unread status
- ✅ Message history
- ✅ Admin message creation
- ✅ Mobile app message viewing
- ✅ Push notifications (planned)

### **8. Teacher Management**
- ✅ Teacher database
- ✅ Auto-generated emails (@nisrineschool.com)
- ✅ Multiple formation assignment
- ✅ Multiple group assignment
- ✅ Password management
- ✅ Status tracking (active/inactive)
- ✅ Teacher portal access
- ✅ Grade upload permissions
- ✅ Attendance QR generation

### **9. Group Management**
- ✅ Group creation and editing
- ✅ Capacity tracking (max students)
- ✅ Current student count
- ✅ Language formation assignment
- ✅ Branch formation (Mixed system)
- ✅ Status management
- ✅ Student assignment

### **10. Mobile Applications**

#### **Student Mobile App (Android/iOS)**
- ✅ Secure login
- ✅ Dashboard with quick access
- ✅ Grades viewing with filters
- ✅ QR code attendance scanning
- ✅ Payment status checking
- ✅ Message viewing
- ✅ Theme switching (Bright/Dark mode)
- ✅ Language selection
- ✅ Profile information
- ✅ Offline support (planned)
- ✅ Push notifications (planned)

## 🛠️ Technologies Used

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Font Awesome Icons
- Google Fonts (Poppins, Tajawal)

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- JWT Authentication
- Multer (file uploads)
- PDFKit (PDF generation)
- bcryptjs (password hashing)

## 📁 Project Structure

```
Nis/
├── index.html              # Main website homepage
├── register.html           # Student registration form
├── admin.html              # Admin panel interface
├── server.js               # Express server entry point
├── setup-admin.js          # Admin account setup script
├── package.json            # Node.js dependencies
├── .env                    # Environment variables (not in git)
├── .env.example            # Environment variables template
├── config/
│   └── database.js         # MongoDB connection config
├── models/
│   ├── Student.js          # Student data model
│   ├── Admin.js            # Admin user model
│   └── Settings.js         # App settings model
├── routes/
│   ├── registration.js     # Registration API routes
│   └── admin.js            # Admin API routes
├── services/
│   └── pdfGenerator.js     # PDF generation service
├── uploads/
│   ├── photos/             # Student photos
│   └── pdfs/               # Generated registration PDFs
├── css/                    # Stylesheets
├── js/                     # Frontend JavaScript
└── Img/                    # Image assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone [repository-url]
   cd Nis
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your MongoDB connection string
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nisrine
   # PORT=3000
   # JWT_SECRET=your-super-secret-key
   ```

4. **Create admin account:**
   ```bash
   node setup-admin.js
   ```
   Follow the prompts to create your admin username and password.

5. **Start the server:**
   ```bash
   npm start
   ```

6. **Access the application:**
   - Main website: http://localhost:3000
   - Registration: http://localhost:3000/register
   - Admin panel: http://localhost:3000/admin

## 📖 Usage Guide

### For Students

1. Visit the registration page: http://localhost:3000/register
2. Fill out the registration form with your details
3. Upload your photo (JPG, PNG, max 5MB)
4. Select your preferred course and specialization
5. Submit the form
6. You'll receive a confirmation message

### For Administrators

1. **Login to Admin Panel:**
   - Go to http://localhost:3000/admin
   - Enter your username and password

2. **Control Registration:**
   - Toggle registration on/off from the dashboard
   - Set custom contact phone number
   - When closed, students see a message with contact info

3. **Manage Registrations:**
   - View all student registrations
   - See statistics (total, pending, approved, rejected)
   - Approve or reject applications
   - Download individual PDFs
   - Delete registrations if needed

4. **Download PDFs:**
   - Click the "📄 PDF" button next to any student
   - PDF will be downloaded automatically
   - PDFs are stored in `uploads/pdfs/` folder

## 🔧 API Endpoints

### Public Endpoints
- `GET /api/registration-status` - Check if registration is open
- `POST /api/register` - Submit new registration (with file upload)

### Admin Endpoints (require JWT token)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/settings` - Get current settings
- `PUT /api/admin/settings` - Update settings
- `GET /api/admin/students` - Get all students
- `GET /api/admin/students/:id` - Get single student
- `PUT /api/admin/students/:id/status` - Update student status
- `GET /api/admin/students/:id/pdf` - Download student PDF
- `DELETE /api/admin/students/:id` - Delete student

## 🔒 Security Features

- JWT-based authentication for admin panel
- Password hashing with bcrypt
- File upload validation (type and size)
- Input validation on client and server
- Protected API routes
- CORS enabled for cross-origin requests

## 📝 Environment Variables

Create a `.env` file with the following variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nisrine
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## 🐛 Troubleshooting

### Server won't start
- Check if MongoDB connection string is correct in `.env`
- Ensure port 3000 is not already in use
- Run `npm install` to ensure all dependencies are installed

### Can't login to admin panel
- Make sure you ran `node setup-admin.js` to create an admin account
- Check MongoDB connection
- Verify JWT_SECRET is set in `.env`

### PDF generation fails
- Check if `uploads/pdfs/` directory exists
- Ensure student photo was uploaded successfully
- Check server logs for detailed error messages

### Registration form not showing
- Check if server is running
- Open browser console for JavaScript errors
- Verify `/api/registration-status` endpoint is working

## 🚀 Deployment

### Deploy to Production

1. **Set environment variables** on your hosting platform
2. **Update MongoDB URI** to production database
3. **Change JWT_SECRET** to a strong random string
4. **Remove or protect** the `/api/admin/create` endpoint
5. **Set up SSL/HTTPS** for secure connections
6. **Configure CORS** for your production domain

### Recommended Hosting
- **Backend**: Heroku, Railway, Render, DigitalOcean
- **Database**: MongoDB Atlas (Free tier available)
- **Frontend**: Can be served by the same Express server

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Support

For questions or issues, please contact the development team or create an issue in the repository.
