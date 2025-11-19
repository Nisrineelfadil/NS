# Restore Student Photos After Deployment

## Problem
After deploying to Vercel, old student photos are gone because:
- Old photos were stored as **file paths** on the local server
- Vercel has **no persistent file system** - files are lost on deployment
- New system stores photos as **base64 in the database** (permanent)

## Solution Options

### Option 1: Manual Re-upload (Recommended for Few Students)

For each student missing a photo:

1. **Navigate to Student Management**
2. **Click Edit** (pencil icon) on the student card
3. **Upload Photo** - Select the student's photo
4. **Click Update** - Photo will be saved as base64 in database
5. **Verify** - Photo should now appear and persist after deployment

**Pros:**
- ✅ Simple and straightforward
- ✅ No technical setup required
- ✅ Works immediately

**Cons:**
- ❌ Time-consuming for many students

---

### Option 2: Bulk Migration Script (For Many Students)

If you have the original photos saved locally, use the migration script.

#### Step 1: Prepare Photos Folder

Create a folder and add student photos:

```powershell
# Create folder
cd c:\Users\Zayd\Desktop\Dev\Nis
mkdir student-photos
```

#### Step 2: Name Photos Correctly

Each photo must be named with the student's **school email** (without @nisrineschool.com):

**Examples:**
- `aeaeae.jpg` → for aeaeae@nisrineschool.com
- `douaekadda.jpg` → for douaekadda@nisrineschool.com
- `zinebmehlil.jpg` → for zinebmehlil@nisrineschool.com

**Supported formats:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

#### Step 3: Run Migration Script

```powershell
cd c:\Users\Zayd\Desktop\Dev\Nis
node scripts/convert-photos-to-base64.js
```

The script will:
- ✅ Read all photos from `./student-photos/` folder
- ✅ Match photos to students by email
- ✅ Convert photos to base64
- ✅ Update database with permanent photo data
- ✅ Show progress and summary

#### Step 4: Verify and Deploy

1. **Check locally** - Refresh admin dashboard to see photos
2. **Commit changes** - Photos are now in database (no code changes needed)
3. **Push to GitHub** - `git push origin master`
4. **Vercel auto-deploys** - Photos will persist after deployment

---

## Why This Happened

### Before (Old System)
```javascript
photoPath: "/uploads/managed-students/student-12345.jpg"
```
- ❌ Stored on server disk
- ❌ Lost on Vercel deployment
- ❌ Not portable

### After (New System)
```javascript
photoPath: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..."
```
- ✅ Stored in MongoDB database
- ✅ Persists across deployments
- ✅ Portable and reliable

---

## Technical Details

### Base64 Storage Benefits
1. **Persistence** - Stored in database, never lost
2. **Portability** - Works on any server (local, Vercel, etc.)
3. **No file system** - No need for uploads folder
4. **Automatic backups** - Included in database backups

### File Size Considerations
- Original photo: ~500 KB
- Base64 encoded: ~670 KB (33% larger)
- MongoDB limit: 16 MB per document (plenty of room)
- Recommended: Keep photos under 2 MB before upload

---

## Troubleshooting

### Script says "Student not found"
- ✅ Check photo filename matches student's school email exactly
- ✅ Email should be lowercase
- ✅ Don't include "@nisrineschool.com" in filename

### Script says "Photos folder not found"
```powershell
# Create the folder
mkdir student-photos

# Verify it exists
ls student-photos
```

### Photos still not showing after migration
1. **Clear browser cache** - Ctrl+Shift+Delete
2. **Hard refresh** - Ctrl+F5
3. **Check database** - Verify photoPath starts with "data:image"
4. **Redeploy** - Push to GitHub and let Vercel redeploy

### New uploads not working
- Check server logs for errors
- Verify file size is under 5 MB
- Ensure file is a valid image format

---

## Quick Reference

### Find Student Email
```javascript
// In browser console on Student Management page
allStudents.map(s => ({ name: s.fullName, email: s.schoolEmail }))
```

### Check Photo Status
```javascript
// In browser console
allStudents.filter(s => !s.photoPath || s.photoPath.includes('undefined'))
```

### Manual Database Update (Advanced)
If you need to update a single student directly:

```javascript
// In MongoDB shell or Compass
db.managedstudents.updateOne(
  { schoolEmail: "student@nisrineschool.com" },
  { $set: { photoPath: "data:image/jpeg;base64,..." } }
)
```

---

## Summary

**For Production (Vercel):**
- ✅ All new photo uploads work automatically
- ✅ Photos stored as base64 in database
- ✅ Photos persist across deployments
- ⚠️ Old photos need to be re-uploaded (one-time task)

**Action Required:**
Choose one option:
1. **Manual re-upload** - Edit each student and upload photo
2. **Bulk migration** - Use script if you have original photos

After fixing, photos will work permanently on both local and production! 🎉
