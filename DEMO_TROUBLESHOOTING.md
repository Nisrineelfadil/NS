# 🔧 DEMO TROUBLESHOOTING GUIDE

**Quick fixes for common issues during demo preparation and execution**

---

## 🚨 CRITICAL ISSUES

### ❌ Server Won't Start

**Symptoms:**
- `npm start` fails
- Port already in use error
- Module not found errors

**Solutions:**

**1. Port Already in Use:**
```bash
# Windows - Check what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID [PID_NUMBER] /F

# Try starting again
npm start
```

**2. Missing Dependencies:**
```bash
# Reinstall all dependencies
npm install

# If that fails, clean install
rm -rf node_modules
rm package-lock.json
npm install
```

**3. Node Version Issues:**
```bash
# Check Node version (should be 14+)
node --version

# If too old, update Node.js
```

---

### ❌ MongoDB Connection Failed

**Symptoms:**
- "Failed to connect to database" error
- "MONGODB_URI not set" error
- Connection timeout

**Solutions:**

**1. Check .env File:**
```bash
# Open .env file
# Verify MONGODB_URI exists and is correct
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

**2. Check Internet Connection:**
- Verify you're online
- Try accessing MongoDB Atlas website
- Check if firewall is blocking connection

**3. Check MongoDB Atlas:**
- Login to MongoDB Atlas
- Verify cluster is running
- Check IP whitelist (should have 0.0.0.0/0 or your IP)
- Verify database user credentials

**4. Test Connection:**
```bash
# Create test-connection.js
node test-connection.js
```

---

### ❌ Login Not Working

**Symptoms:**
- "Invalid credentials" error
- Login button does nothing
- Redirects back to login

**Solutions:**

**1. Clear Browser Data:**
```javascript
// Open browser console (F12)
localStorage.clear();
sessionStorage.clear();
// Refresh page
```

**2. Check Admin Credentials:**
```bash
# Run this script to check admin users
node scripts/check-admin-users.js
```

**3. Check JWT Secret:**
```bash
# Open .env file
# Verify JWT_SECRET exists
JWT_SECRET=your-secret-key-here
```

**4. Reset Admin Password:**
```bash
# Run password reset script
node scripts/reset-admin-password.js
```

---

### ❌ No Data Showing

**Symptoms:**
- Dashboard shows 0 for all stats
- Student list is empty
- No registrations appear

**Solutions:**

**1. Generate Test Data:**
```bash
# Generate test students
node scripts/generate-test-students.js

# This creates:
# - 150 test students
# - Multiple grades per student
# - Realistic data across all levels
```

**2. Check Database Connection:**
```bash
# Verify data exists in database
node scripts/check-database.js
```

**3. Check API Endpoints:**
```bash
# Open browser
# Navigate to: http://localhost:3000/api/health
# Should return: {"status":"ok"}
```

---

## ⚠️ HIGH PRIORITY ISSUES

### ⚠️ Real-Time Notifications Not Working

**Symptoms:**
- Bell icon doesn't update
- No notifications appear
- Badge doesn't show count

**Solutions:**

**1. Check Socket.IO Connection:**
```javascript
// Open browser console (F12)
// Look for: "Admin client connected"
// If missing, Socket.IO isn't connecting
```

**2. Restart Server:**
```bash
# Stop server (Ctrl+C)
# Start again
npm start
```

**3. Check Browser Console:**
- Open DevTools (F12)
- Look for WebSocket errors
- Check Network tab for failed connections

**4. Disable Browser Extensions:**
- Ad blockers can block WebSocket
- Try in incognito mode

---

### ⚠️ Language Switching Not Working

**Symptoms:**
- Language dropdown doesn't work
- Text doesn't translate
- Page stays in same language

**Solutions:**

**1. Check languages.json:**
```bash
# Verify file exists
ls js/languages.json
```

**2. Clear Browser Cache:**
```javascript
// Open browser console (F12)
localStorage.clear();
// Refresh page (Ctrl+Shift+R)
```

**3. Check Console Errors:**
- Open DevTools (F12)
- Look for translation errors
- Check if languages.json loaded

---

### ⚠️ Student Profile Won't Load

**Symptoms:**
- Clicking student does nothing
- Profile page is blank
- Error message appears

**Solutions:**

**1. Check Student ID:**
```javascript
// Open browser console (F12)
// Look for errors like "Student not found"
```

**2. Verify Student Exists:**
```bash
# Check database
node scripts/check-student.js [STUDENT_ID]
```

**3. Check API Response:**
- Open DevTools (F12)
- Go to Network tab
- Look for failed API calls
- Check response status (should be 200)

---

### ⚠️ File Upload Failing

**Symptoms:**
- Photo upload doesn't work
- CIN card upload fails
- "File too large" error

**Solutions:**

**1. Check File Size:**
- Photos should be < 5MB
- CIN cards should be < 2MB
- Compress images if needed

**2. Check File Format:**
- Supported: JPG, PNG, PDF
- Not supported: GIF, BMP, TIFF

**3. Check Server Limits:**
```javascript
// In server.js, check:
app.use(express.json({ limit: '10mb' }));
```

---

## 🟡 MEDIUM PRIORITY ISSUES

### 🟡 Slow Performance

**Symptoms:**
- Pages load slowly (> 5 seconds)
- Actions take long to complete
- Browser feels sluggish

**Solutions:**

**1. Close Unnecessary Tabs:**
- Keep only demo tabs open
- Close DevTools if not needed

**2. Clear Browser Cache:**
```bash
# Hard refresh
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

**3. Check Network:**
- Verify internet speed
- Close bandwidth-heavy apps
- Disconnect other devices

**4. Optimize Database:**
```bash
# Run optimization script
node scripts/optimize-database.js
```

---

### 🟡 Styling Issues

**Symptoms:**
- Layout looks broken
- Elements overlap
- Colors are wrong

**Solutions:**

**1. Check Browser Zoom:**
- Reset to 100% (Ctrl+0)
- Verify zoom level in browser

**2. Clear CSS Cache:**
```bash
# Hard refresh
Ctrl + Shift + R
```

**3. Check CSS Files:**
```bash
# Verify CSS files exist
ls css/admin-dashboard.css
```

**4. Try Different Browser:**
- Chrome (recommended)
- Firefox
- Edge

---

### 🟡 Modal Won't Close

**Symptoms:**
- Modal stays open
- Close button doesn't work
- Can't interact with page

**Solutions:**

**1. Press Escape Key:**
- ESC key should close modal

**2. Click Outside Modal:**
- Click on dark overlay

**3. Refresh Page:**
```bash
# Last resort
F5 or Ctrl+R
```

---

## 🟢 LOW PRIORITY ISSUES

### 🟢 Missing Translations

**Symptoms:**
- Some text not translated
- Shows translation key instead
- English text in other languages

**Solutions:**

**1. Add Missing Translation:**
```javascript
// Edit js/languages.json
// Add missing key under appropriate language
```

**2. Use English as Fallback:**
- System falls back to English
- Not critical for demo

---

### 🟢 Console Warnings

**Symptoms:**
- Yellow warnings in console
- Deprecation notices
- Non-critical errors

**Solutions:**

**1. Ignore During Demo:**
- Warnings don't affect functionality
- Note for post-demo fixes

**2. Clear Console:**
```javascript
// In browser console
console.clear();
```

---

## 🎯 DEMO-SPECIFIC ISSUES

### Issue: Forgot Admin Password

**Solution:**
```bash
# Reset to default password
node scripts/reset-admin-password.js

# Default credentials:
# Username: admin
# Password: admin123
```

---

### Issue: Demo Data Looks Unrealistic

**Solution:**
```bash
# Clean old data
node scripts/cleanup-test-students.js

# Generate new realistic data
node scripts/generate-test-students.js
```

---

### Issue: Screen Sharing Quality Poor

**Solutions:**
1. Close unnecessary apps
2. Reduce screen resolution
3. Use wired internet connection
4. Close other browser tabs
5. Disable video (audio only)

---

### Issue: Audience Can't See Screen

**Solutions:**
1. Increase browser zoom (Ctrl++)
2. Use full screen mode (F11)
3. Increase font size in DevTools
4. Use high contrast theme

---

## 🔍 DIAGNOSTIC COMMANDS

### Check System Health
```bash
# Test API health
curl http://localhost:3000/api/health

# Should return: {"status":"ok"}
```

### Check Database
```bash
# Count students
node scripts/count-students.js

# List all collections
node scripts/list-collections.js
```

### Check Server Logs
```bash
# View server output
# Look for errors (red text)
# Look for warnings (yellow text)
```

### Check Browser Console
```javascript
// Open DevTools (F12)
// Console tab - look for errors
// Network tab - look for failed requests
// Application tab - check localStorage
```

---

## 📞 EMERGENCY PROCEDURES

### If Demo Completely Fails

**Plan A: Use Backup Demo**
1. Show pre-recorded video
2. Walk through screenshots
3. Explain features verbally

**Plan B: Reschedule**
1. Apologize professionally
2. Explain technical difficulty
3. Offer to reschedule
4. Send detailed documentation

**Plan C: Partial Demo**
1. Show working features only
2. Explain non-working features
3. Provide documentation
4. Schedule follow-up

---

## 🛠️ QUICK FIX TOOLKIT

### Essential Commands
```bash
# Restart server
Ctrl+C
npm start

# Clear browser cache
Ctrl+Shift+R

# Clear localStorage
localStorage.clear()

# Check port usage
netstat -ano | findstr :3000

# Kill process
taskkill /PID [PID] /F

# Generate test data
node scripts/generate-test-students.js

# Clean test data
node scripts/cleanup-test-students.js
```

### Essential Files to Check
- `.env` - Environment variables
- `server.js` - Server configuration
- `package.json` - Dependencies
- `js/languages.json` - Translations

### Essential URLs to Test
- http://localhost:3000/ - Homepage
- http://localhost:3000/admin - Admin login
- http://localhost:3000/api/health - API health

---

## 📋 PRE-DEMO CHECKLIST

**Run these checks 30 minutes before demo:**

```bash
# 1. Start server
npm start

# 2. Check health endpoint
curl http://localhost:3000/api/health

# 3. Test login
# Navigate to http://localhost:3000/admin
# Login with credentials

# 4. Check data exists
node scripts/count-students.js

# 5. Test key features
# - Dashboard loads
# - Registrations load
# - Student management works
# - Notifications work
# - Language switching works
```

---

## 🎓 LESSONS LEARNED

**Common Mistakes:**
1. Not testing before demo
2. Not having backup plan
3. Not clearing browser cache
4. Not checking internet connection
5. Not having test data ready

**Best Practices:**
1. Test everything 1 hour before
2. Have backup demo ready
3. Clear browser cache before demo
4. Use incognito mode
5. Have troubleshooting guide handy

---

## 📞 SUPPORT CONTACTS

**If you need help during demo:**

**Technical Issues:**
- Check this guide first
- Check browser console
- Check server logs
- Google the error message

**Database Issues:**
- Check MongoDB Atlas dashboard
- Verify connection string
- Check IP whitelist

**Emergency:**
- Stay calm
- Use backup demo
- Acknowledge issue professionally
- Continue with working features

---

## ✅ POST-ISSUE CHECKLIST

**After fixing an issue:**

- [ ] Issue resolved
- [ ] Root cause identified
- [ ] Solution documented
- [ ] Prevention steps noted
- [ ] Test to confirm fix
- [ ] Continue demo

---

**Remember: Issues happen. How you handle them shows professionalism! 💪**

**Stay calm, follow this guide, and you'll be fine! 🚀**
