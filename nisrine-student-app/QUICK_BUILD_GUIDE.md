# ⚡ Quick Build Guide - Android App

## 🎯 Goal
Build a working APK file for the Nisrine School Android app that can be distributed directly to students.

---

## ✅ Prerequisites Checklist

Before building, ensure:
- [x] All dependencies fixed (completed)
- [x] `package.json` updated with correct versions
- [x] `app.json` configured properly
- [x] `react-native-gesture-handler` imported in App.js
- [ ] Node.js and npm installed
- [ ] Expo CLI installed globally
- [ ] EAS CLI installed globally
- [ ] Expo account created

---

## 🚀 Step-by-Step Build Process

### Step 1: Install Dependencies

```bash
cd nisrine-student-app
npm install
```

**Expected Output**: All packages installed without errors

### Step 2: Verify Setup

```bash
npx expo-doctor
```

**Expected Output**: All checks should pass (or only minor warnings)

### Step 3: Test Locally (Optional but Recommended)

```bash
npx expo start
```

- Press `a` to open in Android emulator
- Or scan QR code with Expo Go app on your phone
- Test all screens and features

### Step 4: Install EAS CLI (if not installed)

```bash
npm install -g eas-cli
```

### Step 5: Login to Expo

```bash
eas login
```

Enter your Expo account credentials.

### Step 6: Configure EAS (First Time Only)

```bash
eas build:configure
```

This creates/updates `eas.json` (already done in your project).

### Step 7: Build APK

```bash
eas build --platform android --profile preview
```

**What happens:**
1. EAS uploads your code to Expo servers
2. Builds the app in the cloud
3. Provides download link when complete
4. Build takes ~10-15 minutes

**Output Example:**
```
✔ Build completed!
Download URL: https://expo.dev/artifacts/eas/abc123.apk
```

### Step 8: Download APK

Click the download link or run:

```bash
eas build:list
```

Find your build and download the APK.

---

## 📱 Installing on Android Device

### Method 1: Direct Download
1. Share the APK download link with students
2. Students open link on Android phone
3. Download APK file
4. Tap to install (may need to enable "Install from Unknown Sources")

### Method 2: Transfer via USB
1. Download APK to computer
2. Connect Android phone via USB
3. Copy APK to phone's Downloads folder
4. Open file manager on phone
5. Tap APK to install

### Method 3: Host on Website
1. Upload APK to your website or Google Drive
2. Share download link
3. Students download and install

---

## 🔄 Updating the App

When you make changes:

```bash
# 1. Update version in app.json
# Change "version": "1.0.1" to "1.0.2"
# Change "versionCode": 2 to 3

# 2. Rebuild
eas build --platform android --profile preview

# 3. Share new APK link with users
```

---

## 🎨 Build Profiles Explained

Your `eas.json` has three profiles:

### 1. Development
```bash
eas build --platform android --profile development
```
- For testing with Expo Dev Client
- Includes development tools
- Larger file size

### 2. Preview (Recommended)
```bash
eas build --platform android --profile preview
```
- **Use this for distribution**
- Builds APK (easy to share)
- Production-ready
- Smaller file size

### 3. Production
```bash
eas build --platform android --profile production
```
- Builds AAB (for Google Play Store)
- Use only if publishing to Play Store
- Requires signing keys

---

## 🐛 Troubleshooting

### "Build failed: Dependency error"
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
npx expo-doctor
```

### "EAS CLI not found"
```bash
npm install -g eas-cli
```

### "Not logged in to Expo"
```bash
eas login
```

### "Build takes too long"
- Builds typically take 10-15 minutes
- Check build status: `eas build:list`
- View logs: `eas build:view [BUILD_ID]`

### "App crashes on install"
- Ensure all dependencies are correct
- Check `npx expo-doctor` passes
- Verify gesture-handler is imported first in App.js

---

## 📊 Build Status Codes

- **Pending** - Build queued
- **In Progress** - Building now
- **Finished** - Success! Download APK
- **Errored** - Build failed, check logs
- **Canceled** - Build was canceled

---

## 💡 Pro Tips

1. **Test before building**: Always test with `npx expo start` first
2. **Version numbers**: Increment version for each build
3. **Build notes**: Add notes when building: `eas build -m "Fixed login bug"`
4. **Check logs**: If build fails, view logs: `eas build:view [BUILD_ID]`
5. **Local builds**: For faster iteration, use `npx expo run:android` (requires Android Studio)

---

## 🎯 Quick Commands Reference

```bash
# Install dependencies
npm install

# Check for issues
npx expo-doctor

# Test locally
npx expo start

# Build APK
eas build --platform android --profile preview

# List all builds
eas build:list

# View build details
eas build:view [BUILD_ID]

# Cancel a build
eas build:cancel [BUILD_ID]
```

---

## 📱 Distribution Checklist

After building:
- [ ] Download APK from EAS
- [ ] Test APK on real Android device
- [ ] Verify all features work
- [ ] Upload APK to hosting (website/Google Drive)
- [ ] Create download page with instructions
- [ ] Share link with students
- [ ] Provide installation guide

---

## 🔐 Security Notes

- APK is signed automatically by EAS
- Students may see "Unknown source" warning (normal)
- Instruct users to enable "Install from Unknown Sources"
- APK is safe - it's your own app

---

## ⏱️ Expected Timeline

- **Setup** (first time): 5-10 minutes
- **Build time**: 10-15 minutes
- **Testing**: 5-10 minutes
- **Distribution**: 5 minutes

**Total**: ~30-40 minutes for first build
**Subsequent builds**: ~15-20 minutes

---

## ✅ Success Criteria

Your build is successful when:
- ✅ `eas build` completes without errors
- ✅ APK downloads successfully
- ✅ App installs on Android device
- ✅ App opens without crashing
- ✅ All screens are accessible
- ✅ QR scanner works
- ✅ API calls succeed

---

## 🎉 You're Ready!

All fixes have been applied. Your app is ready to build!

Run this command to start:
```bash
eas build --platform android --profile preview
```

Good luck! 🚀
