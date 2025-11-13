# Cash Register System - Installation Guide

## 📋 Prerequisites

Before installing, ensure you have:
- ✅ Node.js (v14 or higher)
- ✅ MongoDB (running locally or remote)
- ✅ npm or yarn package manager
- ✅ Existing Nisrine School system

## 🚀 Installation Steps

### Step 1: Verify Dependencies

All required packages are already installed in your system:
- ✅ `express` - Web framework
- ✅ `mongoose` - MongoDB ODM
- ✅ `pdfkit` - PDF generation
- ✅ `jsonwebtoken` - Authentication
- ✅ `bcryptjs` - Password hashing

No additional packages needed!

### Step 2: Files Already Created

The following files have been created in your system:

**Backend:**
```
c:\Users\OMEN\Desktop\DEV\Nis\
├── models/
│   ├── CashTransaction.js      ✅ Created
│   └── MonthlyNote.js          ✅ Created
└── routes/
    └── cashRegister.js         ✅ Created
```

**Frontend:**
```
c:\Users\OMEN\Desktop\DEV\Nis\
├── cash-register.html          ✅ Created
├── css/
│   └── cash-register.css       ✅ Created
└── js/
    └── cash-register.js        ✅ Created
```

**Documentation:**
```
c:\Users\OMEN\Desktop\DEV\Nis\
├── CASH_REGISTER_SYSTEM.md                    ✅ Created
├── CASH_REGISTER_QUICK_START.md               ✅ Created
├── CASH_REGISTER_IMPLEMENTATION_SUMMARY.md    ✅ Created
└── CASH_REGISTER_INSTALLATION.md              ✅ This file
```

**Modified Files:**
```
c:\Users\OMEN\Desktop\DEV\Nis\
├── server.js                   ✅ Updated (routes added)
└── student-management.html     ✅ Updated (menu item added)
```

### Step 3: Start the Server

```bash
cd c:\Users\OMEN\Desktop\DEV\Nis
npm start
```

You should see:
```
🚀 Server running at http://localhost:3000/
📝 Registration API available at /api/register
💰 Cash Register available at /cash-register
```

### Step 4: Access the System

1. **Login to Admin Panel**
   - URL: `http://localhost:3000/admin`
   - Use your admin credentials

2. **Navigate to Cash Register**
   - Option A: Click "Student Management" → "Cash Register" in sidebar
   - Option B: Direct URL: `http://localhost:3000/cash-register`

### Step 5: Verify Installation

**Test Checklist:**
- [ ] Can access `/cash-register` page
- [ ] Dashboard loads without errors
- [ ] Can open "Add Transaction" modal
- [ ] Month selector works
- [ ] Charts display (after adding data)
- [ ] Super admin can see "Yearly Overview" tab
- [ ] Super admin can see "Export PDF" button

## 🔧 Configuration

### Database Collections

Two new collections will be automatically created:
1. `cashtransactions` - Stores all transactions
2. `monthlynotes` - Stores monthly admin notes

No manual database setup required!

### Authentication

The system uses existing JWT authentication:
- Token stored in: `localStorage.getItem('adminToken')`
- User info in: `localStorage.getItem('adminUser')`

### Permissions

**Normal Admin:**
- Can add/edit/delete transactions
- Can view monthly dashboard
- Can add notes

**Super Admin:**
- All normal admin features
- Can view yearly overview
- Can export PDF reports

## 🎨 Customization

### Change Color Scheme

Edit `css/cash-register.css`:
```css
:root {
  --primary-color: #FFCC00;      /* Golden */
  --secondary-color: #FF9500;    /* Orange */
  --success-color: #10b981;      /* Green */
  --danger-color: #ef4444;       /* Red */
}
```

### Add Custom Categories

Edit `js/cash-register.js`:
```javascript
const INCOME_CATEGORIES = [
    'Tuition Fees',
    'Registration Fees',
    // Add your categories here
];

const EXPENSE_CATEGORIES = [
    'Salaries',
    'Rent',
    // Add your categories here
];
```

### Modify PDF Template

Edit `routes/cashRegister.js` - PDF export section:
```javascript
// Header
doc.fontSize(20).text('Your School Name');

// Customize layout, colors, content
```

## 🐛 Troubleshooting

### Problem: Server won't start
**Solution:**
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill the process if needed
taskkill /PID <process_id> /F

# Restart server
npm start
```

### Problem: Can't access cash register page
**Solution:**
1. Verify server is running
2. Check browser console for errors
3. Ensure you're logged in as admin
4. Clear browser cache: Ctrl+Shift+Delete

### Problem: Charts not displaying
**Solution:**
1. Check if Chart.js is loaded:
   - Open browser console
   - Type: `Chart`
   - Should show Chart object
2. Add at least one transaction
3. Refresh the page

### Problem: PDF export not working
**Solution:**
1. Verify you're logged in as super admin
2. Check server logs for errors
3. Ensure pdfkit is installed:
   ```bash
   npm list pdfkit
   ```

### Problem: Database connection error
**Solution:**
1. Check MongoDB is running
2. Verify connection string in `.env`:
   ```
   MONGODB_URI=your_connection_string
   ```
3. Test connection:
   ```bash
   mongosh your_connection_string
   ```

## 📊 Initial Setup

### Add Your First Transaction

1. Go to "Transactions" tab
2. Click "Add Transaction"
3. Fill in:
   ```
   Title: Opening Balance
   Type: Income
   Category: Other Income
   Amount: 0
   Date: Today
   Status: Completed
   Remarks: System initialization
   ```
4. Click "Save"

### Set Up Categories

Categories are predefined but you can add custom ones:
1. When adding a transaction
2. Select type (Income/Expense)
3. In category dropdown, select "+ Add Custom Category"
4. Enter your category name

## 🔐 Security Checklist

- [x] JWT authentication required
- [x] Role-based access control
- [x] Input validation on all forms
- [x] SQL injection prevention
- [x] XSS protection
- [x] HTTPS recommended for production

## 📱 Browser Compatibility

**Supported Browsers:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Required Features:**
- JavaScript enabled
- LocalStorage enabled
- Cookies enabled
- Modern CSS support

## 🚀 Production Deployment

### Before Deploying:

1. **Environment Variables**
   ```bash
   # .env file
   NODE_ENV=production
   MONGODB_URI=your_production_db
   JWT_SECRET=your_secret_key
   ```

2. **Security Headers**
   - Already configured in server.js
   - CORS settings in place
   - HTTPS enforcement recommended

3. **Database Backup**
   ```bash
   mongodump --uri="your_connection_string"
   ```

4. **Test Everything**
   - Run through all features
   - Test on mobile devices
   - Verify PDF exports
   - Check permissions

### Deployment Platforms:

**Vercel:**
```bash
vercel --prod
```

**Heroku:**
```bash
git push heroku main
```

**VPS/Dedicated Server:**
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name "nisrine-school"

# Save PM2 config
pm2 save
pm2 startup
```

## 📈 Performance Optimization

### Database Indexes
Already configured in models:
- `year` and `month` indexed
- `type` indexed
- `category` indexed
- `date` indexed (descending)

### Caching
Consider adding:
- Redis for session storage
- CDN for static assets
- Browser caching headers

### Monitoring
Recommended tools:
- PM2 for process management
- MongoDB Atlas for database monitoring
- New Relic or DataDog for APM

## 📚 Additional Resources

### Documentation Files
- `CASH_REGISTER_SYSTEM.md` - Complete feature documentation
- `CASH_REGISTER_QUICK_START.md` - Quick start guide
- `CASH_REGISTER_IMPLEMENTATION_SUMMARY.md` - Technical summary

### API Documentation
All endpoints documented in `CASH_REGISTER_SYSTEM.md`

### Support
- Check documentation first
- Review browser console for errors
- Check server logs
- Contact system administrator

## ✅ Installation Complete!

Your Cash Register System is now installed and ready to use!

**Next Steps:**
1. ✅ Start the server: `npm start`
2. ✅ Login to admin panel
3. ✅ Navigate to Cash Register
4. ✅ Add your first transaction
5. ✅ Explore all features

**Quick Access:**
- Dashboard: `http://localhost:3000/cash-register`
- Documentation: `CASH_REGISTER_SYSTEM.md`
- Quick Start: `CASH_REGISTER_QUICK_START.md`

---

**🎉 Happy Financial Tracking!**

**Developed for Nisrine School**  
**© 2025 Insight Plus SARL**
