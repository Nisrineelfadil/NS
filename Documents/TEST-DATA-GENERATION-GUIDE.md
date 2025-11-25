# 🧪 Test Data Generation System - Complete Guide

## Overview

This system generates **150 realistic test students** with full data for client demonstrations and testing purposes. All test data is flagged and can be completely removed after use, leaving your system clean as new.

---

## 📋 What Gets Created

### Students (150)
- **Moroccan French names** (e.g., Youssef Alami, Fatima Benali)
- **Formation:** Allemand (German language)
- **Groups:** 8 groups of ~20 students each (A1, A2, B1, B2 levels)
- **Realistic profiles:** Phone numbers, addresses (Fez), birth dates, CIN numbers
- **CIN cards:** Front and back images (placeholder, ~1 MB per student)
- **No photos** (saves 30 MB)
- **Default password:** `test123`

### Associated Data
- **Grades:** 20-30 per student (~3,000-4,500 total)
  - German subjects: Lesen, Hören, Schreiben, Sprechen, Grammatik, Wortschatz
  - Mixed performance levels (excellent, average, struggling)
  - Realistic score distribution

- **Attendance:** 100-150 records per student (~15,000-22,500 total)
  - Last 4 months of data
  - Realistic patterns (70-95% attendance rate)
  - Present, absent, late statuses

- **Payment History:** 5-10 records per student (~750-1,500 total)
  - Monthly fees: 800-1200 MAD
  - 80% payment rate
  - Paid, pending, overdue statuses

- **Groups:** 8 test groups
  - Allemand A1 - Groupe 1 & 2
  - Allemand A2 - Groupe 1 & 2
  - Allemand B1 - Groupe 1 & 2
  - Allemand B2 - Groupe 1 & 2

### Total Impact
- **Documents created:** ~19,000-29,000
- **Storage used:** ~250-280 MB (without photos)
- **M0 capacity:** ~54-58% (with 11 real students)
- **Generation time:** 3-4 hours

---

## 🚀 Quick Start

### Prerequisites
1. Node.js installed
2. MongoDB connection configured in `.env`
3. All dependencies installed (`npm install`)

### Step 1: Generate Test Data

```bash
# Navigate to project directory
cd c:\Users\Zayd\Desktop\Dev\Nis

# Run generation script
node scripts/generate-test-students.js
```

**What happens:**
1. Connects to database
2. Checks current size
3. Creates 8 test groups
4. Generates 150 students in batches of 20
5. Adds grades, attendance, payments for each
6. Shows progress and final statistics

**Expected output:**
```
🚀 Starting test data generation...
📡 Connected to database
📊 Current database size: 22 MB

📋 Creating test groups...
✅ Created 8 test groups

👥 Generating students...
📦 Processing batch 1 (students 1-20)...
  ✅ Batch 1 completed (20 students)
  📊 Database size: 45 MB
...

✨ Test data generation completed!
📊 Summary:
  - Students created: 150
  - Groups created: 8
  - Grades created: 3,750
  - Attendance records: 18,000
  - Payment records: 1,125
  - Total documents: 22,883

💾 Database size:
  - Before: 22 MB
  - After: 278 MB
  - Added: 256 MB
  - Capacity used: 54.3% of 512 MB

✅ All test data generated successfully!
```

### Step 2: Verify Test Data

```bash
# Check system status
node scripts/verify-test-data.js
```

**What it shows:**
- Database size and capacity usage
- Count of real vs test students
- Breakdown of all test data
- Sample test students
- System health status
- Recommendations

### Step 3: Show to Client

**Test student login credentials:**
- **Email format:** `[firstname].[lastname][number]@test.ma`
  - Example: `youssef.alami0@test.ma`
- **Password:** `test123` (all test students)

**What to demonstrate:**
- Browse 150+ students in admin dashboard
- View individual student profiles
- Check grades, attendance, payments
- Search and filter functionality
- Group management
- System performance with realistic data

### Step 4: Cleanup After Demo

```bash
# Remove ALL test data
node scripts/cleanup-test-students.js
```

**Confirmation required:**
- Script will show what will be deleted
- Type `yes` to confirm
- All test data removed in 2-5 minutes
- System returns to original state (11 real students)

---

## 📁 Files Created

### Scripts Directory (`/scripts/`)

1. **`moroccan-names-database.js`**
   - Database of Moroccan names (French spelling)
   - 80+ male first names
   - 80+ female first names
   - 150+ Moroccan last names
   - Fez addresses and streets
   - Moroccan phone number prefixes
   - Helper functions for name/address generation

2. **`generate-test-students.js`**
   - Main generation script
   - Creates 150 students with full data
   - Batch processing (20 students at a time)
   - Progress monitoring
   - Database size tracking
   - Configurable parameters

3. **`cleanup-test-students.js`**
   - Complete removal of test data
   - Safety confirmation required
   - Deletes all associated data
   - Verification after cleanup
   - Shows space recovered

4. **`verify-test-data.js`**
   - System status checker
   - Database statistics
   - Test vs real data breakdown
   - Sample data display
   - Health recommendations

---

## ⚙️ Configuration

### Edit `generate-test-students.js` to customize:

```javascript
const CONFIG = {
  TOTAL_STUDENTS: 150,           // Number of students to generate
  STUDENTS_PER_GROUP: 20,        // Students per group
  FORMATION: 'Allemand',         // Formation name
  GRADES_PER_STUDENT: { min: 20, max: 30 },
  ATTENDANCE_PER_STUDENT: { min: 100, max: 150 },
  PAYMENTS_PER_STUDENT: { min: 5, max: 10 },
  BATCH_SIZE: 20,                // Process in batches
  TEST_BATCH_ID: 'demo-2024'     // Identifier for cleanup
};
```

### German Levels (automatically distributed):
- A1 (Beginner)
- A2 (Elementary)
- B1 (Intermediate)
- B2 (Upper Intermediate)

### German Subjects:
- Lesen (Reading)
- Hören (Listening)
- Schreiben (Writing)
- Sprechen (Speaking)
- Grammatik (Grammar)
- Wortschatz (Vocabulary)

---

## 🔒 Safety Features

### 1. Test Data Flagging
All test data is marked with:
```javascript
{
  isTestData: true,
  testBatch: 'demo-2024'
}
```

### 2. Isolated Deletion
- Cleanup script ONLY deletes data where `isTestData: true`
- **Cannot accidentally delete real students**
- Real data is completely protected

### 3. Verification
- Cleanup script verifies all test data removed
- Shows remaining documents if any
- Confirms system is clean

### 4. Confirmation Required
- Cleanup requires typing `yes` to proceed
- Shows what will be deleted before action
- No accidental deletions

---

## 📊 Storage Impact

### Before Test Data (11 Real Students)
- Database size: ~22 MB
- Capacity used: 4.3% of M0 (512 MB)
- Status: ✅ Healthy

### After Test Data (161 Total Students)
- Database size: ~278 MB
- Capacity used: 54.3% of M0 (512 MB)
- Status: ✅ Safe (below 60% threshold)

### After Cleanup (11 Real Students)
- Database size: ~22 MB
- Capacity used: 4.3% of M0 (512 MB)
- Status: ✅ Clean as new

---

## 🎯 Use Cases

### 1. Client Demonstration
- Show realistic system with 150+ students
- Demonstrate all features with real-looking data
- Impress client with scale and performance
- Easy cleanup after demo

### 2. Performance Testing
- Test system under realistic load
- Identify bottlenecks
- Optimize queries
- Measure response times

### 3. Training
- Train admins/teachers on full system
- Practice with realistic data
- No risk to production data
- Clean up after training

### 4. Development Testing
- Test new features with realistic data
- Verify UI with large datasets
- Test search/filter functionality
- Validate pagination

---

## ⚠️ Important Notes

### DO's ✅
- ✅ Run verification script before and after
- ✅ Backup database before generating (optional)
- ✅ Monitor database size during generation
- ✅ Clean up test data after demo
- ✅ Use for demonstrations and testing only

### DON'Ts ❌
- ❌ Don't use test data in production long-term
- ❌ Don't modify cleanup script (safety risk)
- ❌ Don't delete `isTestData` flag manually
- ❌ Don't generate test data multiple times without cleanup
- ❌ Don't share test student passwords with real users

---

## 🐛 Troubleshooting

### Issue: "Connection failed"
**Solution:** Check `.env` file has correct `MONGODB_URI`

### Issue: "Out of memory"
**Solution:** 
- Reduce `BATCH_SIZE` to 10
- Reduce `TOTAL_STUDENTS` to 100
- Close other applications

### Issue: "Database full"
**Solution:**
- You're at capacity limit
- Run cleanup script first
- Or upgrade to M2

### Issue: "Cleanup not removing all data"
**Solution:**
- Check `isTestData` flag exists on all test documents
- Run verification script to see what remains
- Manually delete via MongoDB Compass if needed

### Issue: "Generation taking too long"
**Solution:**
- Normal for 150 students (3-4 hours)
- Reduce `GRADES_PER_STUDENT` and `ATTENDANCE_PER_STUDENT`
- Increase `BATCH_SIZE` to 30

---

## 📞 Support

### Check System Status
```bash
node scripts/verify-test-data.js
```

### View Database in MongoDB Compass
1. Connect to your MongoDB URI
2. Browse `managedstudents` collection
3. Filter: `{ isTestData: true }`
4. See all test students

### Manual Cleanup (if script fails)
1. Open MongoDB Compass
2. Filter each collection: `{ isTestData: true }`
3. Delete filtered documents
4. Repeat for all collections

---

## 🎓 Example Test Student

```javascript
{
  fullName: "Youssef Alami",
  email: "youssef.alami0@test.ma",
  password: "test123" (hashed),
  phoneNumber: "0612345678",
  dateOfBirth: "1998-05-15",
  gender: "Masculin",
  address: "42, Avenue Hassan II, Médina, Fès, Maroc",
  city: "Fès",
  formation: "Allemand",
  studyLevel: "Bac+2",
  group: ObjectId("..."),
  groupName: "Allemand A2 - Groupe 1",
  cinNumber: "AB123456",
  cinCard: {
    front: "data:image/png;base64,...",
    back: "data:image/png;base64,...",
    uploadedAt: "2024-11-24T00:00:00.000Z"
  },
  enrollmentDate: "2024-09-15",
  status: "active",
  paymentStatus: "paid",
  isTestData: true,
  testBatch: "demo-2024"
}
```

---

## 📈 Performance Expectations

### M0 (512 MB) with Test Data
- **Query time:** 100-300ms (acceptable)
- **Page load:** 1-3 seconds (good)
- **Search:** 200-500ms (acceptable)
- **Grade upload:** 2-5 seconds (good)
- **System stability:** ✅ Stable at 54% capacity

### After Cleanup (11 Real Students)
- **Query time:** 50-100ms (excellent)
- **Page load:** 0.5-1 second (excellent)
- **Search:** 50-150ms (excellent)
- **Grade upload:** 1-2 seconds (excellent)
- **System stability:** ✅ Very stable at 4% capacity

---

## ✅ Checklist

### Before Generation
- [ ] Database backup created (optional)
- [ ] `.env` file configured correctly
- [ ] All dependencies installed
- [ ] Verified current database size
- [ ] Confirmed 11 real students exist

### During Generation
- [ ] Monitor progress in console
- [ ] Check database size after each batch
- [ ] Verify no errors in output
- [ ] Ensure process completes successfully

### After Generation
- [ ] Run verification script
- [ ] Check database size (~278 MB)
- [ ] Test login with sample student
- [ ] Verify all features work
- [ ] Ready for client demo

### After Demo
- [ ] Run cleanup script
- [ ] Confirm deletion (type "yes")
- [ ] Run verification script again
- [ ] Check database size (~22 MB)
- [ ] Verify only 11 real students remain
- [ ] System clean and ready for production

---

## 🎉 Success!

You now have a complete test data generation system that:
- ✅ Creates 150 realistic Moroccan students
- ✅ Generates full data (grades, attendance, payments)
- ✅ Safe and reversible
- ✅ Perfect for client demonstrations
- ✅ Easy cleanup in 2-5 minutes
- ✅ Leaves system clean as new

**Ready to impress your client!** 🚀

---

## 📝 Quick Reference

```bash
# Generate test data
node scripts/generate-test-students.js

# Verify system status
node scripts/verify-test-data.js

# Clean up test data
node scripts/cleanup-test-students.js
```

**Test student login:**
- Email: `[firstname].[lastname][number]@test.ma`
- Password: `test123`

**Remember:** Always clean up after demo! 🧹
