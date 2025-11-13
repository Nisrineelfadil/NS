# 🧪 Test PWA Install Prompt Locally

## Quick Test (Development Mode)

### 1. Start the Development Server
```bash
npm start
```

### 2. Open Chrome DevTools
- Press `F12` or `Ctrl+Shift+I`
- Go to **Console** tab

### 3. Check Service Worker
- Go to **Application** tab
- Click **Service Workers** in left sidebar
- You should see: "Active and running"

### 4. Check Manifest
- Still in **Application** tab
- Click **Manifest** in left sidebar
- Verify:
  - Name: "Nisrine School App"
  - Start URL: "/"
  - Display: "standalone"
  - Icons: 192x192 and 512x512

### 5. Simulate Mobile Device
- Click the **Toggle Device Toolbar** icon (or press `Ctrl+Shift+M`)
- Select a mobile device (e.g., "iPhone 12 Pro" or "Pixel 5")
- Refresh the page

### 6. Wait for Install Prompt
- After 3 seconds, the install prompt should appear
- If it doesn't, check the Console for messages

---

## Test on Real Mobile Device (Same Network)

### 1. Find Your Local IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address

### 2. Start Development Server
```bash
npm start
```

### 3. Access from Mobile
- On your mobile device, open browser
- Go to: `http://YOUR_IP:3000`
- Example: `http://192.168.1.100:3000`

### 4. Test Install Prompt
- **Android**: Wait 3 seconds for install prompt
- **iOS**: Should see iOS instructions modal

---

## Test Production Build Locally

### 1. Build the App
```bash
npm run build
```

### 2. Install Serve (if not installed)
```bash
npm install -g serve
```

### 3. Serve the Build
```bash
serve -s build -p 3000
```

### 4. Open in Browser
```
http://localhost:3000
```

### 5. Test Install Prompt
- Open DevTools
- Simulate mobile device
- Wait 3 seconds
- Install prompt should appear

---

## Force Trigger Install Prompt (Testing)

### Method 1: Clear Storage
1. DevTools → Application → Storage
2. Click "Clear site data"
3. Refresh page
4. Wait 3 seconds

### Method 2: Clear localStorage
1. DevTools → Console
2. Run:
```javascript
localStorage.removeItem('installPromptDismissed');
localStorage.removeItem('installPromptDismissedTime');
location.reload();
```

### Method 3: Unregister Service Worker
1. DevTools → Application → Service Workers
2. Click "Unregister"
3. Refresh page
4. Wait for service worker to register
5. Wait 3 seconds for prompt

---

## Debug Install Prompt Issues

### Check if beforeinstallprompt fires
```javascript
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✅ beforeinstallprompt fired!', e);
});
```

### Check if iOS detected
```javascript
const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
console.log('iOS detected:', isIOS);
```

### Check if already installed
```javascript
const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
console.log('App installed:', isInstalled);
```

### Check localStorage
```javascript
console.log('Dismissed:', localStorage.getItem('installPromptDismissed'));
console.log('Dismissed time:', localStorage.getItem('installPromptDismissedTime'));
```

---

## Common Local Testing Issues

### ❌ Service Worker not registering
**Cause**: Service worker registration is disabled
**Fix**: Check `src/index.js` - should call `serviceWorkerRegistration.register()`

### ❌ Install prompt not appearing
**Cause**: Multiple possible reasons
**Fix**:
1. Check Console for errors
2. Verify service worker is active
3. Clear cache and localStorage
4. Wait 3 seconds after page load
5. Make sure not in standalone mode

### ❌ Manifest not loading
**Cause**: Path issues or MIME type
**Fix**:
1. Check `public/manifest.json` exists
2. Verify path in `public/index.html`
3. Check DevTools → Network → manifest.json (should be 200 OK)

### ❌ Icons not loading
**Cause**: Missing or incorrect paths
**Fix**:
1. Verify `public/icon-192.png` exists
2. Verify `public/icon-512.png` exists
3. Check paths in manifest.json are absolute (`/icon-192.png`)

---

## Test Offline Functionality

### 1. Install the App
- Follow steps above to trigger install prompt
- Install the app

### 2. Enable Offline Mode
- DevTools → Network tab
- Check "Offline" checkbox

### 3. Refresh the Page
- App should still load
- Check Console for "No internet connection" message
- Verify cached content displays

### 4. Test Navigation
- Navigate between pages
- All cached pages should work offline

---

## Mobile Testing Tools

### Chrome Remote Debugging (Android)
1. Enable USB debugging on Android
2. Connect phone to computer via USB
3. Open Chrome on desktop
4. Go to: `chrome://inspect`
5. Select your device
6. Inspect the page

### Safari Web Inspector (iOS)
1. Enable Web Inspector on iPhone (Settings → Safari → Advanced)
2. Connect iPhone to Mac via USB
3. Open Safari on Mac
4. Develop → [Your iPhone] → [Your Page]

---

## Expected Console Messages

### ✅ Success Messages
```
Service worker registered successfully
beforeinstallprompt event fired
iOS device detected - showing iOS install instructions
App is already installed
```

### ⚠️ Warning Messages (OK)
```
Install prompt was dismissed recently
beforeinstallprompt did not fire - showing fallback prompt
```

### ❌ Error Messages (Need fixing)
```
Error during service worker registration
Failed to load manifest
Service worker registration failed
```

---

## Quick Test Script

Copy and paste this in DevTools Console:

```javascript
// PWA Test Script
console.log('=== PWA Test Results ===');

// 1. Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    console.log('✅ Service Worker Support: YES');
    console.log('   Registered:', regs.length > 0 ? 'YES' : 'NO');
  });
} else {
  console.log('❌ Service Worker Support: NO');
}

// 2. Manifest
fetch('/manifest.json')
  .then(r => r.json())
  .then(m => {
    console.log('✅ Manifest:', m.name);
    console.log('   Start URL:', m.start_url);
    console.log('   Display:', m.display);
  })
  .catch(() => console.log('❌ Manifest: Failed to load'));

// 3. Icons
fetch('/icon-192.png')
  .then(r => console.log('✅ Icon 192:', r.ok ? 'OK' : 'MISSING'))
  .catch(() => console.log('❌ Icon 192: MISSING'));

fetch('/icon-512.png')
  .then(r => console.log('✅ Icon 512:', r.ok ? 'OK' : 'MISSING'))
  .catch(() => console.log('❌ Icon 512: MISSING'));

// 4. Install Status
const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
console.log('App Installed:', isInstalled ? 'YES' : 'NO');

// 5. Platform
const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
console.log('Platform:', isIOS ? 'iOS' : 'Android/Desktop');

// 6. localStorage
const dismissed = localStorage.getItem('installPromptDismissed');
console.log('Prompt Dismissed:', dismissed || 'NO');

console.log('======================');
```

---

## 🎯 Success Checklist

- [ ] Service worker registers successfully
- [ ] Manifest loads without errors
- [ ] Icons load (192x192 and 512x512)
- [ ] Install prompt appears after 3 seconds (Android)
- [ ] iOS instructions appear (iOS)
- [ ] App can be installed to home screen
- [ ] App opens in standalone mode
- [ ] App works offline
- [ ] No console errors

---

## 📞 Need Help?

If you're stuck:
1. Run the Quick Test Script above
2. Check Console for error messages
3. Verify all files exist in `public/` folder
4. Make sure service worker is registered
5. Clear cache and try again

**Remember**: PWA features work best on HTTPS in production!
