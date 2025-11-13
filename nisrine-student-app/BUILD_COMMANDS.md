# 🚀 Build Commands Reference

Quick reference for all build and deployment commands.

---

## 📱 Android App Commands

### Setup & Installation
```bash
# Navigate to project
cd nisrine-student-app

# Install dependencies
npm install

# Check for issues
npx expo-doctor

# Fix dependencies automatically
npx expo install --check
```

### Development
```bash
# Start development server
npx expo start

# Start with cache clear
npx expo start -c

# Open on Android emulator
npx expo start --android

# Open on iOS simulator (Mac only)
npx expo start --ios

# Open in web browser
npx expo start --web
```

### Building APK
```bash
# Login to Expo (first time only)
eas login

# Build APK for distribution
eas build --platform android --profile preview

# Build AAB for Google Play Store
eas build --platform android --profile production

# Build with custom message
eas build --platform android --profile preview -m "Fixed login bug"
```

### Build Management
```bash
# List all builds
eas build:list

# View specific build details
eas build:view [BUILD_ID]

# Cancel a build
eas build:cancel [BUILD_ID]

# Download build artifact
eas build:download [BUILD_ID]
```

### Troubleshooting
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear Expo cache
npx expo start -c

# Clear all caches
rm -rf node_modules package-lock.json .expo
npm cache clean --force
npm install
```

---

## 🌐 iOS PWA Commands

### Setup & Installation
```bash
# Navigate to project
cd nisrine-student-pwa

# Install dependencies
npm install
```

### Development
```bash
# Start development server
npm start

# Runs on http://localhost:3000
```

### Building for Production
```bash
# Build production bundle
npm run build

# Output: build/ folder

# Test production build locally
npx serve -s build
```

### Deployment
```bash
# Deploy to Vercel
vercel

# Deploy to Netlify
netlify deploy --prod

# Or use GitHub integration for auto-deploy
```

---

## 🔄 Update Workflow

### When Making Changes:

**1. Update Android App:**
```bash
cd nisrine-student-app

# Make code changes in src/

# Test locally
npx expo start

# Update version in app.json
# "version": "1.0.2"
# "versionCode": 3

# Build new APK
eas build --platform android --profile preview

# Share new APK link with users
```

**2. Update iOS PWA:**
```bash
cd nisrine-student-pwa

# Make code changes in src/

# Test locally
npm start

# Build for production
npm run build

# Deploy
vercel --prod
# or
netlify deploy --prod

# Users get update automatically on next visit!
```

---

## 🧪 Testing Commands

### Android App Testing
```bash
# Run in Expo Go
npx expo start
# Scan QR code with Expo Go app

# Run on Android emulator
npx expo run:android

# Run tests (if configured)
npm test
```

### PWA Testing
```bash
# Test in browser
npm start

# Test production build
npm run build
npx serve -s build

# Test PWA features
# Open in Chrome DevTools → Application → Service Workers
```

---

## 📊 Useful Commands

### Check Versions
```bash
# Node version
node --version

# npm version
npm --version

# Expo CLI version
npx expo --version

# EAS CLI version
eas --version

# Check all dependencies
npm list --depth=0
```

### Update Tools
```bash
# Update npm
npm install -g npm@latest

# Update Expo CLI
npm install -g expo-cli@latest

# Update EAS CLI
npm install -g eas-cli@latest
```

### Clean Everything
```bash
# Android app
cd nisrine-student-app
rm -rf node_modules package-lock.json .expo
npm cache clean --force
npm install

# PWA
cd nisrine-student-pwa
rm -rf node_modules package-lock.json build
npm cache clean --force
npm install
```

---

## 🎯 Quick Actions

### First Time Setup
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Navigate to project
cd nisrine-student-app

# Install dependencies
npm install

# Verify setup
npx expo-doctor
```

### Build & Deploy
```bash
# Android
cd nisrine-student-app
eas build --platform android --profile preview

# iOS PWA
cd nisrine-student-pwa
npm run build
vercel --prod
```

### Emergency Reset
```bash
# If everything breaks
cd nisrine-student-app
rm -rf node_modules package-lock.json .expo
npm cache clean --force
npm install
npx expo-doctor
```

---

## 📝 Notes

- Always run `npx expo-doctor` before building
- Test locally before building APK
- Increment version numbers for each release
- Keep both apps in sync feature-wise
- Document changes in git commits

---

**Quick Start**: `cd nisrine-student-app && eas build --platform android --profile preview`
