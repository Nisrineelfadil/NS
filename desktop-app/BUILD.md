# Quick Build Guide

## Step 1: Install Dependencies

```bash
cd desktop-app
npm install
```

This will install Electron and Electron Builder.

## Step 2: Test the App

```bash
npm start
```

This opens the app in development mode. It will load the admin panel from Vercel.

## Step 3: Build the Desktop App

### For Windows (Installer + Portable):
```bash
npm run build:win
```

**Output files in `dist/` folder:**
- `Nisrine School Admin Setup 1.0.0.exe` - Installer (recommended for distribution)
- `Nisrine School Admin 1.0.0.exe` - Portable version (no installation needed)

### For macOS:
```bash
npm run build:mac
```

**Output:** `dist/Nisrine School Admin-1.0.0.dmg`

### For Linux:
```bash
npm run build:linux
```

**Output:**
- `dist/Nisrine School Admin-1.0.0.AppImage` - Universal Linux app
- `dist/nisrine-school-admin_1.0.0_amd64.deb` - Debian/Ubuntu package

## Step 4: Distribute

### Windows:
Share the **installer** (`Nisrine School Admin Setup 1.0.0.exe`) with users.

They just double-click and install like any Windows program.

### macOS:
Share the **DMG** file. Users drag it to Applications folder.

### Linux:
Share the **AppImage** (easiest) or **DEB** package.

---

## Configuration Options

### Use with Localhost (for testing):

Edit `main.js` line 21-24:
```javascript
// Change from:
const startUrl = 'https://nisrine-school.vercel.app/admin';

// To:
const startUrl = 'http://localhost:3000/admin';
```

Then rebuild.

### Change App Name:

Edit `package.json`:
```json
"productName": "Your Custom Name"
```

### Change Version:

Edit `package.json`:
```json
"version": "1.0.1"
```

---

## Troubleshooting

### "npm: command not found"
Install Node.js from https://nodejs.org/

### Build fails on Windows
Run PowerShell as Administrator

### Build fails on macOS
You need Xcode Command Line Tools:
```bash
xcode-select --install
```

### App won't start
- Check internet connection (for Vercel mode)
- Check if localhost:3000 is running (for local mode)
- Open DevTools (F12) to see errors

---

## File Sizes

- **Windows Installer**: ~150MB
- **Windows Portable**: ~150MB
- **macOS DMG**: ~180MB
- **Linux AppImage**: ~160MB

These sizes are normal for Electron apps (includes Chromium browser).

---

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Test: `npm start`
3. ✅ Build: `npm run build:win` (or mac/linux)
4. ✅ Find your app in `dist/` folder
5. ✅ Share with users!

**That's it!** 🎉
