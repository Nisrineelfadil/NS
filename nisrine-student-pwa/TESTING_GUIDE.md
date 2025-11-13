# PWA Testing Guide

## Quick Start - Test with Deployed Backend

### Step 1: Update API Configuration

Edit `src/config.js` and set your deployed URL:
```javascript
export const API_URL = 'https://nisrinesschool.vercel.app';
```

### Step 2: Update All Screen Files

Replace the hardcoded API_URL in each screen file with the import:

**Files to update:**
- `src/screens/LoginScreen.js`
- `src/screens/GradesScreen.js`
- `src/screens/MessagesScreen.js`
- `src/screens/PaymentScreen.js`
- `src/screens/AttendanceScreen.js`

**Change from:**
```javascript
const API_URL = 'http://192.168.1.31:3000';
```

**To:**
```javascript
import { API_URL } from '../config';
```

### Step 3: Install Dependencies

```bash
cd nisrine-student-pwa
npm install
```

### Step 4: Run Development Server

```bash
npm start
```

The app will open at `http://localhost:3000` (different port if 3000 is taken)

### Step 5: Test the PWA

1. **Login** with a student account:
   - Email: `studentname@nisrineschool.com`
   - Password: (the student's password)

2. **Test Features:**
   - ✅ Dashboard - View student info
   - ✅ Grades - View grades by formation/semester
   - ✅ Messages - Check messages from admin
   - ✅ Payment - View payment status
   - ✅ Attendance - View attendance history

3. **Test PWA Install:**
   - Click the install button on login screen
   - Or use browser menu: "Install app" / "Add to Home Screen"

---

## Build for Production

### Build the PWA

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

### Test Production Build Locally

```bash
npm install -g serve
serve -s build
```

Access at: `http://localhost:3000` (or the port shown)

---

## Deploy PWA to Vercel

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from the nisrine-student-pwa folder
cd nisrine-student-pwa
vercel
```

### Option 2: Deploy via Vercel Dashboard

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository: `Zayddahhaoui0609/ns`
4. Set Root Directory: `nisrine-student-pwa`
5. Click "Deploy"

### Environment Variables (Optional)

If you want to use environment variables:

1. In Vercel dashboard, go to Project Settings → Environment Variables
2. Add: `REACT_APP_API_URL` = `https://nisrinesschool.vercel.app`

---

## Testing Scenarios

### Test 1: Login Flow
- ✅ Valid credentials → Dashboard
- ❌ Invalid credentials → Error message
- ✅ Token persistence → Stays logged in on refresh

### Test 2: Grades Display
- ✅ Filter by formation (Allemand, Anglais, etc.)
- ✅ Filter by branch (Informatique, Gériatrie, etc.)
- ✅ Filter by semester
- ✅ View grade details and statistics

### Test 3: Messages
- ✅ View unread messages
- ✅ Mark messages as read
- ✅ Delete messages
- ✅ Real-time message count

### Test 4: Payment Status
- ✅ View payment date
- ✅ View payment amount
- ✅ See payment status (Paid/Pending/Overdue)

### Test 5: PWA Features
- ✅ Install to home screen
- ✅ Works offline (cached pages)
- ✅ Push notifications (if enabled)
- ✅ App-like experience

---

## Troubleshooting

### Issue: CORS Errors

**Solution:** Make sure your backend (Vercel deployment) has CORS enabled:

```javascript
// In server.js
app.use(cors({
  origin: ['https://your-pwa-domain.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

### Issue: API Not Found (404)

**Solution:** Check that API_URL in `config.js` matches your deployed backend URL exactly.

### Issue: Login Fails

**Solution:** 
1. Check browser console for errors
2. Verify student exists in database
3. Test API endpoint directly: `https://nisrinesschool.vercel.app/api/grades/student/login`

### Issue: PWA Not Installing

**Solution:**
1. Must be served over HTTPS (or localhost)
2. Check `manifest.json` is valid
3. Check service worker is registered
4. Icons must exist (192x192 and 512x512)

---

## Quick Test Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Test production build
npx serve -s build

# Deploy to Vercel
vercel
```

---

## Student Test Accounts

Use any student from your database:
- Email format: `firstname.lastname@nisrineschool.com`
- Password: (set by admin in student management)

Example:
- Email: `john.doe@nisrineschool.com`
- Password: `student123`

---

## Next Steps

1. ✅ Update all API_URL references to use `config.js`
2. ✅ Test locally with `npm start`
3. ✅ Build with `npm run build`
4. ✅ Deploy to Vercel
5. ✅ Test on mobile devices
6. ✅ Share PWA link with students

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check network tab for failed requests
3. Verify backend is running and accessible
4. Test API endpoints with Postman/Thunder Client
