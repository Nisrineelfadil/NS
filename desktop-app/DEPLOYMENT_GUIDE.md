# Desktop App Deployment Guide

## ✅ How It Works (No Server Setup Needed!)

### The Simple Solution:

**Desktop app connects to your Vercel deployment automatically!**

- ✅ No need to run server locally
- ✅ No technical knowledge required
- ✅ Just install and use
- ✅ Works anywhere with internet

---

## 🎯 For Admins (Non-Technical Users):

### Step 1: Install the App
1. Download `Nisrine School Admin Setup 1.0.0.exe`
2. Double-click to install
3. Follow the installer (Next, Next, Install)
4. Done! App is installed

### Step 2: Use the App
1. Open "Nisrine School Admin" from Start Menu or Desktop
2. Login with your admin credentials
3. That's it! Everything works automatically

### No Server Setup Required! ✅
- App connects to `https://nisrine-school.vercel.app` automatically
- All data is on the cloud
- No localhost, no npm, no technical stuff needed

---

## 📱 How Notifications Work:

### When someone registers or gives a rating:

**What happens:**
1. Student registers on the website
2. Data saved to database (MongoDB)
3. Desktop app checks for new notifications every 30 seconds
4. New notification appears in the app (within 30 seconds)
5. Windows toast notification pops up
6. Sound plays
7. Tray icon updates

**Timeline:**
- Registration happens: `0 seconds`
- Desktop app checks: `up to 30 seconds`
- Notification appears: `30 seconds max`

**This is automatic - no manual refresh needed!**

---

## 🔄 Auto-Refresh Features:

The desktop app automatically checks for notifications:

1. **Every 30 seconds** - Automatic background check
2. **When you switch back to the app** - Instant check when window becomes visible
3. **When you click the bell icon** - Manual check

**Result:** You see new notifications within 30 seconds maximum, usually faster!

---

## 🌐 Connection Details:

### Where does the app connect?
- **Production URL:** `https://nisrine-school.vercel.app/admin`
- **No localhost needed**
- **No server setup needed**
- **Works from anywhere**

### What if Vercel is down?
- App will show connection error
- Just wait and retry
- Data is safe in MongoDB

### Internet required?
- ✅ Yes, internet connection required
- ✅ Same as using the website
- ✅ All data is cloud-based

---

## 🛠️ For Developers:

### Building the App:

```bash
cd desktop-app
npm install
npm run build:win
```

**Output:**
- `dist/Nisrine School Admin Setup 1.0.0.exe` - Installer
- `dist/Nisrine School Admin 1.0.0.exe` - Portable

### Configuration:

**Default (Production):**
```javascript
const startUrl = 'https://nisrine-school.vercel.app/admin';
```

**For Testing (Localhost):**
Edit `main.js` line 26:
```javascript
const startUrl = 'http://localhost:3000/admin';
```

Then rebuild: `npm run build:win`

---

## 📊 Notification Polling Strategy:

### Why 30 seconds?

**Balance between:**
- ✅ Fast enough (notifications appear quickly)
- ✅ Low server load (not too many requests)
- ✅ Battery friendly (not constant polling)
- ✅ User-friendly (feels responsive)

### Can I make it faster?

Yes! Edit `main.js` line 153:
```javascript
// Change from 30000 (30 seconds) to 10000 (10 seconds)
}, 10000);
```

**Trade-offs:**
- Faster: 10 seconds = more server requests
- Slower: 60 seconds = less responsive

**Recommended: 30 seconds** (good balance)

---

## 🎯 Distribution Workflow:

### For the Admin Team:

1. **Developer builds the app:**
   ```bash
   npm run build:win
   ```

2. **Developer shares the installer:**
   - Upload `Nisrine School Admin Setup 1.0.0.exe` to Google Drive/Dropbox
   - Share link with admins

3. **Admins install:**
   - Download the installer
   - Run it (double-click)
   - Login with credentials
   - Done!

4. **Updates:**
   - Build new version
   - Share new installer
   - Admins reinstall (keeps settings)

---

## 🔐 Security:

### Authentication:
- ✅ Same login as website
- ✅ JWT tokens
- ✅ Secure HTTPS connection
- ✅ No passwords stored locally

### Data:
- ✅ All data on MongoDB (cloud)
- ✅ No local database
- ✅ No sensitive data stored in app
- ✅ Auto-logout on token expiry

---

## 🐛 Troubleshooting:

### App won't start:
- Check internet connection
- Try running as administrator
- Reinstall the app

### No notifications appearing:
- Check if logged in
- Wait 30 seconds after an event
- Check internet connection
- Press F12 to see console logs

### "Cannot connect to server":
- Check if Vercel is up: https://nisrine-school.vercel.app
- Check internet connection
- Try refreshing (Ctrl+R)

### White screen:
- Wait a few seconds (loading)
- Check internet connection
- Force reload (Ctrl+Shift+R)
- Check console (F12)

---

## 📈 Performance:

### App Size:
- **Installer:** ~150MB
- **Installed:** ~200MB
- **Memory usage:** ~100-150MB
- **CPU usage:** <1% idle

### Network Usage:
- **Initial load:** ~5MB (loads website)
- **Notification check:** ~1KB every 30 seconds
- **Daily usage:** ~5-10MB total

### Battery Impact:
- Minimal (background checks are lightweight)
- Same as having a browser tab open

---

## ✅ Summary:

### What Admins Need to Know:
1. ✅ Install the app (one-time)
2. ✅ Login with credentials
3. ✅ Notifications appear automatically (within 30 seconds)
4. ✅ No server setup needed
5. ✅ Works anywhere with internet

### What Developers Need to Know:
1. ✅ App connects to Vercel automatically
2. ✅ Auto-polling every 30 seconds
3. ✅ Build once, distribute to all admins
4. ✅ No backend changes needed
5. ✅ Everything works out of the box

---

## 🎉 The Result:

**Simple for admins:**
- Install → Login → Use
- No technical knowledge needed
- Notifications work automatically

**Easy for developers:**
- Build → Share → Done
- No server maintenance
- No support calls

**Everyone happy!** ✅

---

## 📞 Support:

If admins have issues:
1. Check internet connection
2. Try restarting the app
3. Check if they can access https://nisrine-school.vercel.app in browser
4. Reinstall the app
5. Contact developer if still not working

**Most common issue:** Internet connection ✅  
**Most common fix:** Restart app ✅
