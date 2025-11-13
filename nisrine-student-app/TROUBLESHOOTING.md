# 🔧 Troubleshooting Guide - Nisrine School Android App

## 🎯 Common Issues & Solutions

This guide covers all common issues you might encounter when building or running the Android app.

---

## ✅ Pre-Build Issues

### Issue: `npx expo-doctor` shows errors

**Symptoms:**
```
✖ Check that required peer dependencies are installed
✖ Check that packages match versions required by installed Expo SDK
```

**Solution:**
```bash
# Fix dependencies automatically
npx expo install --check

# Or manually reinstall
rm -rf node_modules package-lock.json
npm install
```

**Prevention:**
- Always run `npx expo-doctor` before building
- Keep dependencies updated with `npx expo install --check`

---

### Issue: Missing `react-native-gesture-handler`

**Symptoms:**
```
Missing peer dependency: react-native-gesture-handler
Required by: @react-navigation/stack
```

**Solution:**
```bash
npx expo install react-native-gesture-handler
```

**Then add to top of App.js:**
```javascript
import 'react-native-gesture-handler';
```

---

### Issue: Duplicate dependencies

**Symptoms:**
```
Found duplicates for @react-native-async-storage/async-storage
```

**Solution:**
```bash
# Remove node_modules
rm -rf node_modules package-lock.json

# Install with exact versions
npm install

# Or use expo install
npx expo install @react-native-async-storage/async-storage
```

---

### Issue: Version mismatches

**Symptoms:**
```
package       expected  found
expo          54.0.20   54.0.16
react-native  0.81.5    0.81.4
```

**Solution:**
```bash
# Update to correct versions
npx expo install --check

# Select 'yes' when prompted
```

---

## 🏗️ Build Issues

### Issue: EAS Build fails with "Dependency error"

**Symptoms:**
```
Build failed: Unable to resolve module
```

**Solution:**
```bash
# 1. Clean everything
rm -rf node_modules package-lock.json .expo

# 2. Reinstall
npm install

# 3. Verify
npx expo-doctor

# 4. Try building again
eas build --platform android --profile preview
```

---

### Issue: "Not logged in to Expo"

**Symptoms:**
```
Error: Not logged in
```

**Solution:**
```bash
# Login to Expo
eas login

# Enter your credentials
# If no account, create one at expo.dev
```

---

### Issue: "EAS CLI not found"

**Symptoms:**
```
'eas' is not recognized as an internal or external command
```

**Solution:**
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Verify installation
eas --version
```

---

### Issue: Build takes forever

**Symptoms:**
- Build stuck at "Pending" or "In Progress" for >30 minutes

**Solution:**
```bash
# 1. Check build status
eas build:list

# 2. View build logs
eas build:view [BUILD_ID]

# 3. If stuck, cancel and retry
eas build:cancel [BUILD_ID]
eas build --platform android --profile preview
```

**Note:** Normal build time is 10-15 minutes.

---

### Issue: Build fails with "New Architecture" error

**Symptoms:**
```
Error: Package X is not compatible with New Architecture
```

**Solution:**
In `app.json`, set:
```json
{
  "expo": {
    "newArchEnabled": false
  }
}
```

**Already fixed in your project!**

---

### Issue: Missing assets (icon, splash screen)

**Symptoms:**
```
Error: Cannot find file './assets/icon.png'
```

**Solution:**
```bash
# Ensure these files exist in assets/ folder:
assets/
├── icon.png (1024x1024)
├── adaptive-icon.png (1024x1024)
├── splash-icon.png (1284x2778)
└── favicon.png (48x48)

# If missing, create placeholder images
# Or use Expo's default assets
```

---

## 📱 Runtime Issues

### Issue: App crashes on startup

**Symptoms:**
- App opens then immediately closes
- White screen then crash

**Solution:**

**1. Check gesture-handler import:**
```javascript
// App.js - MUST be first import
import 'react-native-gesture-handler';
import React from 'react';
// ... other imports
```

**2. Check navigation setup:**
```javascript
// Ensure NavigationContainer wraps everything
<NavigationContainer>
  <Stack.Navigator>
    {/* screens */}
  </Stack.Navigator>
</NavigationContainer>
```

**3. Check for console errors:**
```bash
# Run with logs
npx expo start
# Press 'a' for Android
# Check terminal for errors
```

---

### Issue: QR Scanner doesn't work

**Symptoms:**
- Camera doesn't open
- Permission denied error
- Black screen when scanning

**Solution:**

**1. Check permissions in app.json:**
```json
{
  "android": {
    "permissions": [
      "CAMERA",
      "INTERNET"
    ]
  }
}
```

**2. Check plugin configuration:**
```json
{
  "plugins": [
    [
      "expo-barcode-scanner",
      {
        "cameraPermission": "Allow $(PRODUCT_NAME) to access camera for QR code scanning."
      }
    ]
  ]
}
```

**3. Request permission in code:**
```javascript
import { BarCodeScanner } from 'expo-barcode-scanner';

const [hasPermission, setHasPermission] = useState(null);

useEffect(() => {
  (async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  })();
}, []);

if (hasPermission === null) {
  return <Text>Requesting camera permission...</Text>;
}
if (hasPermission === false) {
  return <Text>No access to camera</Text>;
}
```

---

### Issue: API calls fail

**Symptoms:**
- Network request failed
- Cannot connect to server
- 404 or 500 errors

**Solution:**

**1. Check API URL:**
```javascript
// Make sure URL is correct
const API_URL = 'https://your-backend.com/api';
// NOT 'localhost' (won't work on device)
```

**2. Check HTTPS:**
```javascript
// Must use HTTPS in production
// HTTP only works with localhost
```

**3. Check CORS:**
```javascript
// Backend must allow requests from app
// Add CORS headers on server
```

**4. Test API separately:**
```bash
# Use Postman or curl to test API
curl https://your-backend.com/api/test
```

---

### Issue: App doesn't work offline

**Symptoms:**
- App crashes when no internet
- Data doesn't persist

**Solution:**

**1. Use AsyncStorage:**
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save data
await AsyncStorage.setItem('key', JSON.stringify(data));

// Load data
const data = await AsyncStorage.getItem('key');
```

**2. Add error handling:**
```javascript
try {
  const response = await fetch(API_URL);
  const data = await response.json();
  // Save to AsyncStorage
} catch (error) {
  // Load from AsyncStorage
  const cachedData = await AsyncStorage.getItem('key');
  if (cachedData) {
    // Use cached data
  }
}
```

---

### Issue: Navigation doesn't work

**Symptoms:**
- Buttons don't navigate
- "Cannot read property 'navigate' of undefined"

**Solution:**

**1. Check screen is in Stack.Navigator:**
```javascript
<Stack.Navigator>
  <Stack.Screen name="Login" component={LoginScreen} />
  <Stack.Screen name="Dashboard" component={DashboardScreen} />
</Stack.Navigator>
```

**2. Use navigation prop correctly:**
```javascript
// In functional component
function MyScreen({ navigation }) {
  const handlePress = () => {
    navigation.navigate('Dashboard');
  };
  
  return <Button onPress={handlePress} title="Go" />;
}
```

**3. Or use useNavigation hook:**
```javascript
import { useNavigation } from '@react-navigation/native';

function MyComponent() {
  const navigation = useNavigation();
  
  const handlePress = () => {
    navigation.navigate('Dashboard');
  };
  
  return <Button onPress={handlePress} title="Go" />;
}
```

---

## 🔐 Installation Issues

### Issue: "Install blocked" on Android

**Symptoms:**
- "For your security, your phone is not allowed to install unknown apps from this source"

**Solution:**
1. Go to Settings → Security
2. Enable "Unknown Sources" or "Install Unknown Apps"
3. Select your browser/file manager
4. Allow installation
5. Try installing APK again

---

### Issue: "App not installed" error

**Symptoms:**
- Installation fails with generic error

**Solution:**

**1. Uninstall old version:**
```bash
# If app was previously installed
# Settings → Apps → Nisrine School → Uninstall
```

**2. Clear cache:**
```bash
# Settings → Storage → Clear Cache
```

**3. Redownload APK:**
```bash
# APK file might be corrupted
# Download again from source
```

**4. Check storage space:**
```bash
# Ensure device has enough space (50+ MB)
```

---

## 🐛 Development Issues

### Issue: Expo Go shows error

**Symptoms:**
- "Unable to resolve module"
- "Something went wrong"

**Solution:**
```bash
# 1. Clear Expo cache
npx expo start -c

# 2. Clear Metro bundler cache
rm -rf .expo
rm -rf node_modules/.cache

# 3. Restart
npx expo start
```

---

### Issue: Hot reload doesn't work

**Symptoms:**
- Changes don't appear
- Need to manually reload

**Solution:**
```bash
# 1. Shake device (or press Cmd+M / Ctrl+M)
# 2. Select "Enable Fast Refresh"

# Or restart with cache clear
npx expo start -c
```

---

### Issue: TypeScript errors (if using TS)

**Symptoms:**
```
Type 'X' is not assignable to type 'Y'
```

**Solution:**
```bash
# Install type definitions
npm install --save-dev @types/react @types/react-native

# Or ignore TypeScript errors temporarily
# Add to tsconfig.json:
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

---

## 📊 Performance Issues

### Issue: App is slow

**Symptoms:**
- Laggy animations
- Slow screen transitions
- High memory usage

**Solution:**

**1. Enable Hermes:**
```json
// app.json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

**2. Optimize images:**
```javascript
// Use optimized images
<Image 
  source={{ uri: 'url' }}
  resizeMode="contain"
  style={{ width: 200, height: 200 }}
/>
```

**3. Use FlatList for long lists:**
```javascript
// Instead of map()
<FlatList
  data={items}
  renderItem={({ item }) => <ItemComponent item={item} />}
  keyExtractor={item => item.id}
/>
```

---

## 🔄 Update Issues

### Issue: Users have old version

**Symptoms:**
- Users report bugs that are fixed
- Old UI appears

**Solution:**

**1. Increment version:**
```json
// app.json
{
  "version": "1.0.2",  // was 1.0.1
  "android": {
    "versionCode": 3   // was 2
  }
}
```

**2. Rebuild and redistribute:**
```bash
eas build --platform android --profile preview
# Share new APK link
```

**3. Add update check in app:**
```javascript
// Check for updates on startup
useEffect(() => {
  checkForUpdates();
}, []);

async function checkForUpdates() {
  const response = await fetch('https://your-api.com/version');
  const { latestVersion } = await response.json();
  
  if (latestVersion > currentVersion) {
    Alert.alert(
      'Update Available',
      'A new version is available. Please download the latest version.',
      [{ text: 'Download', onPress: () => openDownloadLink() }]
    );
  }
}
```

---

## 🆘 Emergency Fixes

### Nuclear Option: Complete Reset

If nothing works, start fresh:

```bash
# 1. Delete everything
rm -rf node_modules package-lock.json .expo

# 2. Clear npm cache
npm cache clean --force

# 3. Reinstall
npm install

# 4. Verify
npx expo-doctor

# 5. Test
npx expo start

# 6. Build
eas build --platform android --profile preview
```

---

## 📞 Getting Help

### Check Logs:

**1. Expo logs:**
```bash
npx expo start
# Logs appear in terminal
```

**2. Build logs:**
```bash
eas build:list
eas build:view [BUILD_ID]
```

**3. Device logs:**
```bash
# Android
adb logcat

# Or use React Native Debugger
```

### Resources:

- **Expo Docs**: https://docs.expo.dev/
- **Expo Forums**: https://forums.expo.dev/
- **Stack Overflow**: Tag with `expo` and `react-native`
- **GitHub Issues**: https://github.com/expo/expo/issues

---

## ✅ Verification Checklist

Before considering an issue "fixed":

- [ ] `npx expo-doctor` passes all checks
- [ ] App runs in Expo Go without errors
- [ ] All screens are accessible
- [ ] QR scanner works
- [ ] API calls succeed
- [ ] App works offline
- [ ] Navigation works smoothly
- [ ] No console errors
- [ ] Build completes successfully
- [ ] APK installs on real device
- [ ] App opens without crashing

---

## 🎯 Quick Reference

### Most Common Issues:
1. ❌ Missing gesture-handler → ✅ Add import to App.js
2. ❌ Version mismatch → ✅ Run `npx expo install --check`
3. ❌ Build fails → ✅ Clean install: `rm -rf node_modules && npm install`
4. ❌ QR scanner broken → ✅ Check permissions in app.json
5. ❌ App crashes → ✅ Check gesture-handler import is first

### Quick Fixes:
```bash
# Fix dependencies
npx expo install --check

# Clear cache
npx expo start -c

# Clean install
rm -rf node_modules && npm install

# Verify setup
npx expo-doctor
```

---

**Remember**: Most issues are dependency-related. When in doubt, clean install! 🧹
