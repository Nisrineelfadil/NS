# Final Untranslated Elements - Complete List

## All Remaining Untranslated Text (From Screenshots)

### 1. Grades Table (Image 1)
**Table Headers:**
- Exam Type → `t('examType')`
- Score → `t('score')`
- Percentage → `t('percentage')`
- Status → `t('status')`
- Exam Date → `t('examDate')`
- Teacher → `t('teacher')`
- Comments → `t('comments')`

**Status Badge:**
- Approved → `t('approved')`

**Translation Keys Available:** ✅ All exist in translations.js

---

### 2. Attendance Statistics (Image 2)
**Card Headers:**
- Total Records → `t('totalRecords')`
- Present → `t('present')`
- Late → `t('late')`
- Absent → `t('absent')`

**Card Descriptions:**
- All attendance sessions → `t('allAttendanceSessions')`
- 78.6% of total records → `${percentage}% ${t('ofTotalRecords')}`
- 0.0% of total records → `${percentage}% ${t('ofTotalRecords')}`
- 21.4% of total records → `${percentage}% ${t('ofTotalRecords')}`

**Attendance Rate Card:**
- Attendance Rate → `t('attendanceRate')`
- Present + Late combined → `t('presentLateCombined')`

**Translation Keys Available:** ✅ All exist

---

### 3. Teacher Management Table (Image 3)
**Table Headers:**
- Name → `t('name')`
- Email → `t('email')`
- Phone → `t('phone')`
- Formations → `t('formations')`
- Assigned Groups → `t('assignedGroups')`
- Status → `t('status')`
- Actions → `t('actions')`

**Status Badge:**
- active → `t('active')`

**Translation Keys Available:** ✅ All exist

---

### 4. Branch/Subject Groups (Image 4)
**Section Header:**
- Branch/Subject Groups → `t('branchSubjectGroups')`

**Description:**
- "Optional subject groups (IT, Cooking, etc.) - Students choose these in addition to their language group" → `t('branchSubjectGroupsDescription')`

**Button:**
- Refresh → `t('refresh')`

**Branch Names (Already in French/German, but labels need translation):**
- Culinary Arts → Keep as is (name)
- Healthcare Assistant → Keep as is (name)
- Restaurant & Hospitality → Keep as is (name)
- etc.

**Subgroups Count:**
- "1 subgroups" → `${count} ${t('subgroups')}`
- "0 subgroups" → `${count} ${t('subgroups')}`

**Need to Add:**
```javascript
branchSubjectGroups: "Zweig-/Fachgruppen",
branchSubjectGroupsDescription: "Optionale Fachgruppen (IT, Kochen, etc.) - Schüler wählen diese zusätzlich zu ihrer Sprachgruppe",
subgroups: "Untergruppen"
```

---

### 5. Pending Branch Assignments (Image 5)
**Header:**
- Pending Branch Assignments → `t('pendingBranchAssignments')`

**Description:**
- "Students who selected a subject but haven't been assigned to a subgroup yet" → `t('pendingBranchAssignmentsDescription')`

**Success Message:**
- "All students with subjects have been assigned to subgroups!" → `t('allStudentsAssigned')`

**Need to Add:**
```javascript
pendingBranchAssignments: "Ausstehende Zweigzuweisungen",
pendingBranchAssignmentsDescription: "Schüler, die ein Fach gewählt haben, aber noch keiner Untergruppe zugewiesen wurden",
allStudentsAssigned: "Alle Schüler mit Fächern wurden Untergruppen zugewiesen!"
```

---

### 6. Student Profile Modal (Image 6)
**Section Headers:**
- CONTACT INFORMATION → `t('contactInformation')`
- ACADEMIC SUMMARY → `t('academicSummary')`

**Contact Info:**
- No personal email → `t('noPersonalEmail')`
- Download CIN Card → `t('downloadCINCard')`
- Not Uploaded → `t('notUploaded')`

**Academic Summary:**
- No season → `t('noSeason')`
- Group C → Keep as is (dynamic data)
- 1 Language → `${count} ${t('language')}`
- 1 Branch → `${count} ${t('branch')}`

**Translation Keys:** ✅ Most exist, need to add:
```javascript
language: "Sprache",
branch: "Zweig"
```

---

### 7. Payment Reminders (Image 7)
**Section Headers:**
- Due in 15 Days → `t('dueIn15Days')`
- 3 Students → `${count} ${t('students')}`
- Due Tomorrow → `t('dueTomorrow')`
- 1 Student → `${count} ${t('student')}`

**Table Headers:**
- Student → `t('student')`
- Group → `t('group')`
- Phone → `t('phone')`
- Formation → `t('formation')`
- Payment Date → `t('paymentDate')`
- Amount → `t('amount')`
- Actions → `t('actions')`

**Translation Keys Available:** ✅ All exist

---

## Summary of Missing Translation Keys

Add these to `/js/translations.js`:

```javascript
// Add to German section (de:)
branchSubjectGroups: "Zweig-/Fachgruppen",
branchSubjectGroupsDescription: "Optionale Fachgruppen (IT, Kochen, etc.) - Schüler wählen diese zusätzlich zu ihrer Sprachgruppe",
subgroups: "Untergruppen",
pendingBranchAssignments: "Ausstehende Zweigzuweisungen",
pendingBranchAssignmentsDescription: "Schüler, die ein Fach gewählt haben, aber noch keiner Untergruppe zugewiesen wurden",
allStudentsAssigned: "Alle Schüler mit Fächern wurden Untergruppen zugewiesen!",
language: "Sprache",
branch: "Zweig",
examType: "Prüfungstyp",
score: "Punktzahl",
percentage: "Prozentsatz",
comments: "Kommentare",
approved: "Genehmigt"
```

## Files That Need Updates

Based on the screenshots, these JavaScript files likely generate the content:

1. **Grades Table** - Probably in `student-management.js` or a grades module
2. **Attendance Stats** - Likely in `admin-attendance.js`
3. **Teacher Table** - Likely in `student-management.js` `loadTeachers()` function
4. **Branch Groups** - Likely in `phase2-functions.js` or `branch-groups-management.js`
5. **Student Profile** - Likely in `phase2-student-profile.js`
6. **Payment Reminders** - Likely in `student-management.js`

## Next Steps

1. Add the missing translation keys above to `/js/translations.js`
2. Find where each section is generated in JavaScript
3. Replace hardcoded English text with `t('key')` calls
4. Test each section

---

**Total Remaining:** ~40 text elements across 7 sections
**Estimated Time:** 30-45 minutes to update all JavaScript files
