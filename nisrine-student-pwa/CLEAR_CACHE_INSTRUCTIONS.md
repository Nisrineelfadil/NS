# 🧹 Clear PWA Cache Instructions

## Problem Fixed
The database has been cleaned up - all orphaned grades have been removed and student references are now correct.

## Clear Cache on Mobile Devices

### For Students Using the PWA:

#### **Android (Chrome)**
1. Open the PWA app
2. Tap the **3 dots** menu (⋮) in top right
3. Tap **Settings**
4. Tap **Site settings**
5. Tap **Clear & reset**
6. Confirm

**OR** (Easier method):
1. Long press the app icon on home screen
2. Tap **App info**
3. Tap **Storage**
4. Tap **Clear storage** and **Clear cache**
5. Reopen the app and login again

#### **iOS (Safari)**
1. Open **Settings** app
2. Scroll down to **Safari**
3. Tap **Advanced**
4. Tap **Website Data**
5. Find "nisrineschool" and swipe left to delete
6. Or tap **Remove All Website Data**
7. Reopen the PWA and login again

### For Testing in Browser:

#### **Chrome DevTools**
1. Open the PWA in Chrome
2. Press **F12** to open DevTools
3. Go to **Application** tab
4. Click **Clear storage** (left sidebar)
5. Check all boxes
6. Click **Clear site data**
7. Refresh page (Ctrl+R or Cmd+R)

#### **Quick Method**
1. Press **Ctrl+Shift+Delete** (Windows) or **Cmd+Shift+Delete** (Mac)
2. Select **Cached images and files**
3. Select **All time**
4. Click **Clear data**

## What This Does
- Removes old cached student data
- Forces the app to fetch fresh data from server
- Ensures each student sees only their own grades

## After Clearing Cache
Students will need to **login again** with their credentials.
