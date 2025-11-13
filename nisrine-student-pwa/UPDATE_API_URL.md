# Quick Update - Use Deployed Backend

## Automatic Update (Recommended)

I'll update all screen files to use the centralized config. Just follow the testing guide after.

## Manual Update (If Needed)

In each of these files:
- `src/screens/LoginScreen.js`
- `src/screens/GradesScreen.js`
- `src/screens/MessagesScreen.js`
- `src/screens/PaymentScreen.js`
- `src/screens/AttendanceScreen.js`

**Replace line 8:**
```javascript
const API_URL = 'http://192.168.1.31:3000';
```

**With:**
```javascript
import { API_URL } from '../config';
```

Then remove the old `const API_URL = ...` line.

## Your Deployed Backend URL

```
https://nisrinesschool.vercel.app
```

This is already set in `src/config.js`

## Test Commands

```bash
# 1. Install dependencies
cd nisrine-student-pwa
npm install

# 2. Start development server
npm start

# 3. Open browser to http://localhost:3000
# 4. Login with a student account
# 5. Test all features
```

## Deploy PWA

```bash
# Build production version
npm run build

# Deploy to Vercel
vercel
```

Your PWA will be live at a Vercel URL like:
`https://nisrine-student-pwa.vercel.app`
