# 🔧 How to Fix Branch Subgroups Appearing in Wrong Seasons

## The Problem
You're seeing old branch subgroups (like "Restaurant & Hospitality GROUP 1") in your new 2026-2027 season, even though language groups are working correctly and showing empty.

## Why This Happens
The old branch subgroups in your database don't have a `season` field yet. The fix we implemented requires this field, but existing data needs to be migrated.

## The Solution (3 Simple Steps)

### Step 1: Run the Migration Script

Open your terminal in the project folder and run:

```bash
node fix-branch-seasons.js
```

This will:
- Find all branch subgroups without season data
- Assign them to your active season (2026-2027)
- Show you exactly what was updated

**Expected Output:**
```
🔧 BRANCH SEASON FIX - Migration Tool
═══════════════════════════════════════════════════════════

🔧 Connecting to database...
✅ Connected!

📅 Active Season Found: 2026-2027
   ID: 673...
   Dates: 30/08/2026 - 30/08/2027

🔍 Found 8 branch subgroups without season data

📋 Subgroups that will be updated:
────────────────────────────────────────────────────────────
1. Restaurant & Hospitality GROUP 1
   Branch: Restaurant & Hospitality
   Students: 1

[... more subgroups ...]

✅ MIGRATION COMPLETE!
```

### Step 2: Restart Your Server

After the migration completes:

```bash
npm start
```

### Step 3: Verify the Fix

1. Open your browser and go to **Seasons & Groups**
2. Select the **2026-2027** season
3. Click on **Branch Management** tab
4. You should now see the correct subgroups (or empty if you want to start fresh)

## Alternative: Start Fresh (Delete Old Subgroups)

If you don't need the old branch subgroups and want to start with a clean slate:

### Option A: Using MongoDB Compass or Shell

1. Connect to your database
2. Go to the `groups` collection
3. Delete documents where:
   - `groupType` = "branch"
   - `season` does not exist

### Option B: Using the Script

Modify `fix-branch-seasons.js` to delete instead of migrate:

```javascript
// Replace the update loop with:
for (const subgroup of subgroupsToFix) {
    await subgroup.deleteOne();
    console.log(`🗑️  Deleted: ${subgroup.name}`);
}
```

Then run: `node fix-branch-seasons.js`

## What Happens After Migration

✅ **Each season will have its own branch subgroups**
✅ **New seasons start with empty branch lists**
✅ **No more cross-season contamination**
✅ **Students stay with their correct subgroups**

## Troubleshooting

### Error: "No active season found"
**Solution**: Create an active season first in the admin panel, then run the script again.

### Error: "Cannot connect to database"
**Solution**: Check your `.env` file has the correct `MONGODB_URI`

### Subgroups still showing in wrong season
**Solution**: 
1. Clear your browser cache
2. Restart the server
3. Check the database to verify season field was added

## Need More Help?

See these files for more details:
- `BRANCH_SEASON_BUG_FIX.md` - Technical details of the fix
- `MIGRATION_REQUIRED.md` - Detailed migration guide
- `migrations/migrate-branch-subgroups-to-seasons.js` - Alternative migration script

---

**Quick Command Reference:**
```bash
# Run the fix
node fix-branch-seasons.js

# Restart server
npm start

# Check if it worked
# Go to: localhost:3000/student-management
# Navigate to: Seasons & Groups → 2026-2027 → Branch Management
```
