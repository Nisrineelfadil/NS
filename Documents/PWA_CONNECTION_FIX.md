# PWA Connection Issue - Troubleshooting Guide

## ✅ Good News
The PWA is **successfully deployed and installed**! The 500 errors are fixed.

## ❌ Current Issue
The PWA shows: "Failed to connect to server. Please check your connection."

## 🔍 Root Cause Analysis

The error occurs when the PWA tries to call:
```
POST https://nisrine-school.vercel.app/api/grades/student/login
```

### Possible Causes:

1. **Vercel Environment Variables Not Set**
   - MongoDB URI not configured
   - JWT_SECRET not configured
   - Server can't connect to database

2. **MongoDB Connection Timeout**
   - Vercel serverless functions have cold start
   - First request might timeout (10 second limit in PWA)

3. **API Route Not Deployed**
   - The `/api/grades/*` routes might not be included in Vercel build

## 🔧 Solutions

### Solution 1: Check Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
MONGODB_URI = mongodb+srv://nisrine_admin:<password>@nisrineschool.c0pgjgg.mongodb.net/?retryWrites=true&w=majority&appName=nisrineschool
JWT_SECRET = your-super-secret-jwt-key-change-this-in-production
PORT = 3000
```

5. **Redeploy** after adding variables

### Solution 2: Test API Manually

1. Open `test-api-connection.html` in your browser
2. Click "Test API Connection"
3. Click "Test Student Login"
4. Check if API is responding

### Solution 3: Check Vercel Logs

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Deployments** → Click latest deployment
4. Click **Functions** tab
5. Look for errors in `/api/grades/student/login`

### Solution 4: Increase Timeout in PWA

If MongoDB is slow to connect, increase timeout:

**File:** `nisrine-student-pwa/src/screens/LoginScreen.js`

Change line 32 from:
```javascript
timeout: 10000,  // 10 seconds
```

To:
```javascript
timeout: 30000,  // 30 seconds
```

Then rebuild and redeploy:
```bash
cd nisrine-student-pwa
npm run build
cd ..
xcopy /E /I /Y nisrine-student-pwa\build pwa
git add pwa
git commit -m "increase-api-timeout"
git push origin main:master
```

### Solution 5: Add Health Check Endpoint

Add a simple health check to verify server is running:

**File:** `server.js` (add before other routes)

```javascript
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});
```

Then test: https://nisrine-school.vercel.app/api/health

## 🧪 Testing Steps

1. **Test API Health:**
   - Visit: https://nisrine-school.vercel.app/api/health
   - Should return: `{"status":"ok",...}`

2. **Test Login Endpoint:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Run:
   ```javascript
   fetch('https://nisrine-school.vercel.app/api/grades/student/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: 'test@test.com', password: 'test' })
   }).then(r => r.json()).then(console.log)
   ```
   - Should return error message (not connection error)

3. **Test from PWA:**
   - Clear browser cache
   - Open PWA: https://nisrine-school.vercel.app/pwa/
   - Try logging in with real credentials
   - Check DevTools Console for detailed error

## 📊 Expected Behavior

### ✅ Working:
- PWA loads (no 500 errors)
- Static files load (JS, CSS)
- Login form appears
- Install prompt works

### ❌ Not Working:
- API connection fails
- Login doesn't work

## 🎯 Next Steps

1. **Check Vercel environment variables** (most likely cause)
2. **Check Vercel function logs** for errors
3. **Test API manually** using test-api-connection.html
4. **Increase timeout** if needed
5. **Add health check** endpoint

## 📝 Quick Fix Script

Run this to increase timeout and redeploy:

```batch
@echo off
cd nisrine-student-pwa
npm run build
cd ..
xcopy /E /I /Y nisrine-student-pwa\build pwa
git add pwa
git commit -m "update-pwa-build"
git push origin main:master
echo.
echo Wait 1-2 minutes for Vercel deployment
echo Then test: https://nisrine-school.vercel.app/pwa/
pause
```

## 🔗 Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- PWA URL: https://nisrine-school.vercel.app/pwa/
- API Test: Open test-api-connection.html
- GitHub Repo: https://github.com/Zayddahhaoui0609/ns
