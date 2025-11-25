# 🚀 Quick Start: Test Data Generation

## Generate 150 Test Students in 3 Commands

---

## 1️⃣ Generate Test Data (3-4 hours)

```bash
node scripts/generate-test-students.js
```

**Creates:**
- 150 Moroccan students (French names)
- 8 groups (Allemand A1-B2)
- ~3,750 grades
- ~18,000 attendance records
- ~1,125 payment records
- **Total:** ~250 MB added to database

---

## 2️⃣ Verify System (30 seconds)

```bash
node scripts/verify-test-data.js
```

**Shows:**
- Database size and capacity
- Test vs real student counts
- System health status
- Sample test students

---

## 3️⃣ Cleanup After Demo (2-5 minutes)

```bash
node scripts/cleanup-test-students.js
```

**Type `yes` to confirm**

**Removes:**
- All 150 test students
- All associated data
- Returns system to original state (11 real students)

---

## 🔑 Test Student Login

**Email format:** `[firstname].[lastname][number]@test.ma`

**Examples:**
- `youssef.alami0@test.ma`
- `fatima.benali1@test.ma`
- `mehdi.tazi2@test.ma`

**Password:** `test123` (all test students)

---

## 📊 Expected Results

### Before Test Data
- Database: ~22 MB (4.3% of M0)
- Students: 11 real

### After Test Data
- Database: ~278 MB (54.3% of M0)
- Students: 161 total (11 real + 150 test)

### After Cleanup
- Database: ~22 MB (4.3% of M0)
- Students: 11 real
- **System clean as new!** ✅

---

## ⚠️ Important

1. **Generation takes 3-4 hours** - Be patient!
2. **Always cleanup after demo** - Don't forget!
3. **Test data is safe** - Cannot delete real students
4. **M0 capacity: 54%** - Safe zone (below 60%)

---

## 🆘 Need Help?

**Check status:**
```bash
node scripts/verify-test-data.js
```

**Full documentation:**
See `Documents/TEST-DATA-GENERATION-GUIDE.md`

---

## ✅ Ready to Go!

1. Run generation script
2. Wait 3-4 hours
3. Show to client
4. Run cleanup
5. Done! 🎉
