# Nisrine School Mobile App - Build Instructions

## Version 1.0.1

### What's New in v1.0.1
- ✅ Global theme system (Bright/Dark mode)
- ✅ Instant theme switching across entire app
- ✅ Fixed payment status display
- ✅ Changed currency to MAD (Moroccan Dirham)
- ✅ Improved error handling and timeouts
- ✅ Better debugging with console logs
- ✅ Beautiful Settings screen
- ✅ Theme persistence across app restarts

---

## Prerequisites

1. **Node.js** installed (v18 or higher)
2. **Expo CLI** installed globally:
   ```bash
   npm install -g expo-cli
   ```
3. **EAS CLI** installed globally (for building):
   ```bash
   npm install -g eas-cli
   ```

---

## Build Options

### Option 1: Build APK with EAS (Recommended)

This creates a production-ready APK file that can be installed on any Android device.

#### Step 1: Login to Expo
```bash
cd nisrine-student-app
eas login
```

#### Step 2: Configure the build
```bash
eas build:configure
```

#### Step 3: Build APK
```bash
eas build --platform android --profile preview
```

This will:
- Upload your code to Expo servers
- Build the APK in the cloud
- Provide a download link when complete (usually 10-15 minutes)

#### Step 4: Download APK
- Click the link provided in the terminal
- Or go to: https://expo.dev/accounts/[your-account]/projects/nisrine-student-app/builds
- Download the APK file

---

### Option 2: Build Locally with Expo

This creates a development build for testing.

```bash
cd nisrine-student-app
expo build:android
```

---

### Option 3: Development Build (Testing Only)

For testing during development:

```bash
cd nisrine-student-app
npm start
```

Then:
- Scan QR code with Expo Go app
- Or press 'a' to open in Android emulator

---

## Installing the APK

### On Physical Device:
1. Transfer the APK file to your Android device
2. Enable "Install from Unknown Sources" in Settings
3. Tap the APK file to install
4. Open "Nisrine School" app

### On Emulator:
```bash
adb install nisrine-student-app-v1.0.1.apk
```

---

## Configuration

### Update Server IP Address

Before building, update the API URL in these files:

1. `src/screens/LoginScreen.js` (line 17)
2. `src/screens/GradesScreen.js` (line 16)
3. `src/screens/AttendanceScreen.js`
4. `src/screens/PaymentScreen.js`
5. `src/screens/MessagesScreen.js`

Change:
```javascript
const API_URL = 'http://192.168.1.31:3000';
```

To your server's IP address.

---

## App Features

### 1. Authentication
- Login with school email and password
- Secure JWT token storage

### 2. Dashboard
- Quick access to all features
- Student information display
- Theme toggle

### 3. Grades
- View grades by language/subject
- Filter by exam number and semester
- Grade statistics and averages
- Color-coded grade letters

### 4. Attendance
- Scan QR codes for attendance
- View attendance history
- Real-time status updates

### 5. Payment
- View payment status
- Payment due dates
- Amount in MAD currency

### 6. Messages
- School announcements
- Important notifications

### 7. Settings
- Theme switching (Bright/Dark)
- Language selection (English/French/Arabic)
- App information

---

## Troubleshooting

### Build Fails
- Make sure all dependencies are installed: `npm install`
- Clear cache: `expo start -c`
- Check Expo account is logged in: `eas whoami`

### App Crashes on Launch
- Check server is running
- Verify API URL is correct
- Check device has internet connection

### Cannot Connect to Server
- Ensure device is on same WiFi as server
- Check Windows Firewall allows port 3000
- Verify server IP address is correct

---

## File Structure

```
nisrine-student-app/
├── App.js                          # Main app entry with ThemeProvider
├── app.json                        # Expo configuration
├── eas.json                        # EAS Build configuration
├── package.json                    # Dependencies
├── assets/                         # Images and icons
├── src/
│   ├── context/
│   │   └── ThemeContext.js        # Global theme management
│   └── screens/
│       ├── LoginScreen.js         # Login page
│       ├── DashboardScreen.js     # Main dashboard
│       ├── GradesScreen.js        # Grades view
│       ├── AttendanceScreen.js    # QR scanner
│       ├── PaymentScreen.js       # Payment info
│       ├── MessagesScreen.js      # Announcements
│       └── SettingsScreen.js      # Theme & settings
```

---

## Version History

### v1.0.1 (Current)
- Added global theme system
- Fixed payment status API
- Changed currency to MAD
- Improved error handling
- Added Settings screen
- Better UI/UX

### v1.0.0
- Initial release
- Basic authentication
- Grades viewing
- Attendance scanning
- Payment status
- Messages

---

## Support

For issues or questions:
- Check server logs
- Verify network connectivity
- Review console logs in Expo
- Check API endpoints are accessible

---

## License

© 2025 Nisrine School. All rights reserved.
