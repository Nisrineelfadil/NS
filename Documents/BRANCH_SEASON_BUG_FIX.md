# Branch System Season Bug Fix

## Problem Description
When creating a new season, the branch management system was incorrectly showing branches from the previous season instead of starting with an empty list. This occurred because branch subgroups were not tied to seasons, causing them to appear across all seasons.

## Root Cause
1. **Branch subgroups (Groups with `groupType: 'branch'`) did not have a required `season` field** - they only had an optional season field that was only required for language groups
2. **The API endpoint `/api/branch-groups` returned ALL branch groups globally**, not filtered by season
3. **The frontend `loadBranchManagement` function didn't pass the season parameter** when loading branch data
4. **Branch subgroup creation didn't include season information**

## Solution Implemented

### 1. Model Changes (`/models/Group.js`)
- **Made `season` and `seasonName` fields required for ALL group types** (both language and branch)
- This ensures every branch subgroup is tied to a specific season

```javascript
season: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: true  // Now required for both language and branch groups
},
seasonName: {
    type: String,
    required: true  // Now required for both language and branch groups
}
```

### 2. API Changes (`/routes/branchGroups.js`)

#### GET `/api/branch-groups` - Filter by Season
- Added season query parameter support
- Filters subgroup counts by season when `?season=<seasonId>` is provided

```javascript
// Filter by season if provided
if (req.query.season) {
    query.season = req.query.season;
}
```

#### GET `/api/branch-groups/:id/subgroups` - Filter Subgroups by Season
- Added season query parameter support
- Returns only subgroups for the specified season

```javascript
// Filter by season if provided
if (req.query.season) {
    query.season = req.query.season;
    console.log('   Filtering by season:', req.query.season);
}
```

#### POST `/api/branch-groups/:id/subgroups` - Require Season on Creation
- Now requires `season` and `seasonName` in request body
- Validates season is provided before creating subgroup
- Counts existing subgroups per season for auto-naming

```javascript
const { name, maxStudents, season, seasonName } = req.body;

// Validate season is provided
if (!season || !seasonName) {
    return res.status(400).json({ error: 'Season ID and name are required' });
}
```

#### POST `/api/branch-groups/:id/assign-student` - Season-Aware Assignment
- Gets student's season from their language group
- Only creates/assigns to subgroups in the same season as the student
- Validates subgroup and student are in the same season

```javascript
// Get student's season from their language group
const studentDoc = await ManagedStudent.findById(studentId).populate('group');
if (!studentDoc || !studentDoc.group || !studentDoc.group.season) {
    return res.status(400).json({ error: 'Student must be assigned to a language group first' });
}

const studentSeason = studentDoc.group.season;
const studentSeasonName = studentDoc.group.seasonName;
```

### 3. Frontend Changes (`/js/phase2-functions.js`)

#### `loadBranchManagement(seasonId)` - Pass Season Filter
- Now passes `season` query parameter to API
- Added logging for debugging

```javascript
fetch(`/api/branch-groups?season=${seasonId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
})
```

#### `viewBranchSubgroups(branchGroupId)` - Filter by Current Season
- Validates current season is selected
- Passes season parameter when loading subgroups

```javascript
// Ensure we have a current season
if (!currentSeasonId) {
    showNotification('Please select a season first', 'warning');
    return;
}

// Load subgroups filtered by current season
const subgroupsResponse = await fetch(`/api/branch-groups/${branchGroupId}/subgroups?season=${currentSeasonId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
});
```

#### `submitCreateBranchSubgroup()` - Include Season Data
- Validates current season is selected
- Includes `season` and `seasonName` in creation request

```javascript
// Ensure we have current season data
if (!currentSeasonId || !currentSeasonData) {
    throw new Error('No active season selected');
}

body: JSON.stringify({
    name: formData.get('name') || null,
    maxStudents: parseInt(formData.get('maxStudents')),
    season: currentSeasonId,
    seasonName: currentSeasonData.name
})
```

## Expected Behavior After Fix

### ✅ New Season Creation
- When a new season is created, the branch management tab shows **zero branches by default**
- No branches are inherited from previous seasons

### ✅ Season Switching
- Switching between seasons shows only the branches created for that specific season
- Each season maintains its own independent branch list

### ✅ Branch Subgroup Creation
- New branch subgroups are automatically tied to the current active season
- Cannot create subgroups without selecting a season first

### ✅ Student Assignment
- Students can only be assigned to branch subgroups in their own season
- System validates season consistency between student's language group and branch subgroup

### ✅ Data Isolation
- Branches from Season A do not appear when viewing Season B
- No cross-season contamination of branch data

## Migration Notes

### Existing Data
- **Existing branch subgroups without season data will need to be updated manually or via migration script**
- The model now requires season for all groups, so existing branch subgroups may fail validation

### Recommended Migration Steps
1. Identify all existing branch subgroups without season data
2. Assign them to appropriate seasons based on creation date or student assignments
3. Update the documents with season and seasonName fields

### Migration Script (Optional)
```javascript
// Example migration to assign existing branch subgroups to a default season
const Season = require('./models/Season');
const Group = require('./models/Group');

async function migrateBranchSubgroups() {
    const activeSeason = await Season.findOne({ status: 'active' });
    
    const branchSubgroups = await Group.find({
        groupType: 'branch',
        $or: [
            { season: { $exists: false } },
            { season: null }
        ]
    });
    
    for (const subgroup of branchSubgroups) {
        subgroup.season = activeSeason._id;
        subgroup.seasonName = activeSeason.name;
        await subgroup.save();
        console.log(`Migrated ${subgroup.name} to season ${activeSeason.name}`);
    }
}
```

## Testing Checklist

- [ ] Create a new season
- [ ] Verify branch management tab shows empty list for new season
- [ ] Create a branch subgroup in the new season
- [ ] Switch to a previous season
- [ ] Verify the new subgroup does NOT appear in the previous season
- [ ] Switch back to the new season
- [ ] Verify the new subgroup appears correctly
- [ ] Assign a student to a branch subgroup
- [ ] Verify season consistency is enforced
- [ ] Test with multiple seasons to ensure complete isolation

## Files Modified

1. `/models/Group.js` - Made season required for all group types
2. `/routes/branchGroups.js` - Added season filtering and validation
3. `/js/phase2-functions.js` - Updated frontend to pass and use season parameters

## Status
✅ **FIXED** - Branch system now properly isolates branches by season. Each new season starts with a clean, empty branch list.
