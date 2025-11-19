# ⚠️ MIGRATION REQUIRED - Branch Subgroups Season Assignment

## Problem
The branch system fix requires all branch subgroups to have a `season` field, but **existing subgroups in your database don't have this field yet**. This is why you're seeing old branches appear in the new 2026-2027 season.

## What You're Seeing
- ✅ **Language Groups**: Working correctly - new season shows empty list
- ❌ **Branch Management**: Showing old subgroups from previous seasons because they lack season data

## Solution: Run Migration Script

### Option 1: Automatic Migration (RECOMMENDED)

Run the migration script to automatically assign all existing branch subgroups to your active season:

```bash
node migrations/migrate-branch-subgroups-to-seasons.js
```

This will:
1. Find your active season (2026-2027)
2. Find all branch subgroups without season data
3. Assign them all to the active season
4. Show you a summary of what was updated

**⚠️ Important**: This will assign ALL existing branch subgroups to your current active season (2026-2027). If you have subgroups from multiple past seasons that you want to preserve separately, use Option 2 instead.

### Option 2: Manual Migration via MongoDB

If you want more control over which subgroups go to which season:

1. **Connect to your MongoDB database**

2. **View subgroups without season**:
```javascript
db.groups.find({ 
    groupType: 'branch', 
    season: { $exists: false } 
})
```

3. **Assign to specific season**:
```javascript
// First, get your season ID
db.seasons.find({ name: "2025-2026" })  // or whatever season

// Then update subgroups
db.groups.updateMany(
    { 
        groupType: 'branch',
        season: { $exists: false }
    },
    { 
        $set: { 
            season: ObjectId("YOUR_SEASON_ID_HERE"),
            seasonName: "2025-2026"
        }
    }
)
```

### Option 3: Delete Old Subgroups (If Not Needed)

If you don't need the old branch subgroups and want to start fresh:

```javascript
// ⚠️ WARNING: This deletes data permanently!
db.groups.deleteMany({ 
    groupType: 'branch',
    season: { $exists: false }
})
```

## After Migration

Once you run the migration:

1. **Restart your server**: `npm start`
2. **Navigate to Seasons & Groups**
3. **Select the 2026-2027 season**
4. **Switch to Branch Management tab**
5. **You should now see an empty list** (or only subgroups created for 2026-2027)

## Creating New Branch Subgroups

After migration, when you create new branch subgroups:
- They will automatically be tied to the current active season
- They will only appear when viewing that specific season
- No more cross-season contamination

## Verification Steps

After running migration, verify the fix:

1. ✅ View 2026-2027 season → Branch Management → Should show empty or only 2026-2027 subgroups
2. ✅ Create a new branch subgroup in 2026-2027
3. ✅ Switch to 2025-2026 season (if it exists)
4. ✅ Verify the new subgroup does NOT appear in 2025-2026
5. ✅ Switch back to 2026-2027
6. ✅ Verify the new subgroup appears correctly

## Why This Happened

The original system didn't tie branch subgroups to seasons - they were global entities. The fix we implemented:
- Made `season` field required for all groups (including branch subgroups)
- Updated API to filter by season
- Updated frontend to pass season parameter

But existing data in the database still lacks the season field, so it needs to be migrated.

## Need Help?

If you encounter issues:
1. Check MongoDB connection in `.env` file
2. Verify you have an active season
3. Check the migration script output for errors
4. Review the `BRANCH_SEASON_BUG_FIX.md` file for technical details
