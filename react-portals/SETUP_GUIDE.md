# 🚀 React Portals - Setup & Testing Guide

## ✅ Phase 1 Complete!

All components have been created for the **Student Portal** and **Teacher Portal** in React.

---

## 📦 Installation

### Step 1: Install Dependencies

```bash
cd c:\Users\OMEN\Desktop\DEV\Nis\react-portals
npm install
```

This will install:
- React 18
- React Router DOM
- Axios
- Vite (dev server)

---

## 🏃 Running the Application

### Step 2: Start Backend Server

In one terminal:

```bash
cd c:\Users\OMEN\Desktop\DEV\Nis
node server.js
```

Backend runs on: `http://localhost:3000`

### Step 3: Start React Dev Server

In another terminal:

```bash
cd c:\Users\OMEN\Desktop\DEV\Nis\react-portals
npm run dev
```

React app runs on: `http://localhost:5173`

---

## 🧪 Testing Checklist

### Student Portal Testing

1. **Login**
   - [ ] Navigate to `http://localhost:5173/`
   - [ ] Login with student credentials (schoolEmail + password)
   - [ ] Verify redirect after successful login
   - [ ] Test invalid credentials error

2. **Dashboard**
   - [ ] Check stats cards (Total Grades, Average Score)
   - [ ] Verify user info displays correctly
   - [ ] Test logout button

3. **Grades View**
   - [ ] Verify grades table displays all grades
   - [ ] Check color-coded grade letters (A-F)
   - [ ] Test exam type badges

4. **Filters**
   - [ ] Filter by Formation
   - [ ] Filter by Semester (1, 2)
   - [ ] Filter by Academic Year
   - [ ] Test combined filters

5. **Messages Panel**
   - [ ] Click Messages button
   - [ ] Verify panel slides in from right
   - [ ] Test delete individual message
   - [ ] Test clear all messages
   - [ ] Close panel

6. **Mobile Responsive**
   - [ ] Test on mobile viewport (375px)
   - [ ] Check table transforms to cards
   - [ ] Verify touch-friendly buttons
   - [ ] Test messages panel (full width on mobile)

---

### Teacher Portal Testing

1. **Login**
   - [ ] Navigate to `http://localhost:5173/teacher`
   - [ ] Login with teacher credentials (@nisrineschool.com email)
   - [ ] Verify redirect after successful login
   - [ ] Test invalid credentials error

2. **Formation Selection**
   - [ ] Verify formations display correctly
   - [ ] Test auto-selection if teacher has 1 formation
   - [ ] Check "(Auto-assigned)" badge appears
   - [ ] Test formation selection

3. **Group Selection**
   - [ ] Verify groups load after formation selected
   - [ ] Check group info (student count, formation)
   - [ ] Test group selection
   - [ ] Verify branch teachers see ALL groups
   - [ ] Verify language teachers see only their groups

4. **Students Grid**
   - [ ] Verify students load after group selected
   - [ ] Check student cards display correctly
   - [ ] Verify student photos/initials
   - [ ] Check module boxes (4 exam types)
   - [ ] Verify existing grades show with scores
   - [ ] Test empty modules show "Click to grade"

5. **Grade Upload Modal**
   - [ ] Click on any module box
   - [ ] Verify modal opens
   - [ ] Check existing grades list
   - [ ] Test upload new grade form
   - [ ] Verify all fields (exam type, score, max score, semester, year, date, comments)
   - [ ] Test form validation (score > max score)
   - [ ] Submit grade and verify success

6. **Grade Edit/Delete**
   - [ ] Click edit button on existing grade
   - [ ] Verify form populates with grade data
   - [ ] Update grade and verify success
   - [ ] Test delete grade with confirmation
   - [ ] Verify grade removed from list

7. **Mobile Responsive**
   - [ ] Test on mobile viewport
   - [ ] Check formation/group selectors stack
   - [ ] Verify student cards stack vertically
   - [ ] Test modal on mobile
   - [ ] Check form fields stack properly

---

## 🔍 Common Issues & Solutions

### Issue: "Cannot find module"
**Solution:** Run `npm install` in the react-portals directory

### Issue: API calls failing (CORS errors)
**Solution:** Make sure backend server is running on port 3000

### Issue: Login not working
**Solution:** 
1. Check backend server is running
2. Verify database connection
3. Check browser console for errors
4. Verify credentials are correct

### Issue: Grades not loading
**Solution:**
1. Check if student/teacher has grades in database
2. Verify formation/group filters are correct
3. Check browser network tab for API errors

### Issue: Styles not loading
**Solution:**
1. Hard refresh browser (Ctrl + Shift + R)
2. Clear browser cache
3. Check if CSS files exist

---

## 📁 File Structure Reference

```
react-portals/
├── src/
│   ├── components/common/       # Shared components
│   │   ├── Header.jsx/css
│   │   ├── Modal.jsx/css
│   │   └── Loading.jsx/css
│   ├── pages/
│   │   ├── StudentPortal/       # Student portal
│   │   │   ├── StudentPortal.jsx/css
│   │   │   └── components/
│   │   │       ├── LoginForm.jsx/css
│   │   │       ├── StatsCards.jsx/css
│   │   │       ├── GradesFilters.jsx/css
│   │   │       ├── GradesTable.jsx/css
│   │   │       └── MessagesPanel.jsx/css
│   │   └── TeacherPortal/       # Teacher portal
│   │       ├── TeacherPortal.jsx/css
│   │       └── components/
│   │           ├── LoginForm.jsx/css
│   │           ├── FormationSelector.jsx/css
│   │           ├── GroupSelector.jsx/css
│   │           ├── StudentsGrid.jsx/css
│   │           └── GradeModal.jsx/css
│   ├── services/
│   │   └── api.js               # API service layer
│   ├── context/
│   │   └── AuthContext.jsx      # Authentication
│   ├── App.jsx                  # Main app + routes
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── package.json
├── vite.config.js
└── index.html
```

---

## 🎯 Next Steps (Phase 2)

After testing Phase 1:

1. **Add Exam Tabs Feature** (Future enhancement)
   - Organize exams by tabs
   - Better grade organization

2. **Add QR Code Attendance** (Future enhancement)
   - QR code generation
   - Attendance tracking

3. **Production Build**
   ```bash
   npm run build
   ```
   - Output in `dist/` folder
   - Deploy to production

---

## 🆘 Need Help?

- Check browser console for errors
- Check network tab for API failures
- Verify backend is running
- Check database connection
- Review API endpoints in `src/services/api.js`

---

## ✨ Features Implemented

### Student Portal ✅
- Login with school email
- View grades with filters
- Statistics (total, average)
- Color-coded grade letters
- Messages panel
- Fully responsive

### Teacher Portal ✅
- Login with @nisrineschool.com
- Auto-select formation
- Select group
- View students grid
- Upload/edit/delete grades
- 4 exam types support
- Branch vs Language filtering
- Fully responsive

### Technical ✅
- React 18 + Vite
- React Router
- Axios API calls
- JWT authentication
- Context API for state
- CSS modules
- Mobile responsive
- Same backend (no changes)

---

**Status:** ✅ Ready for testing!
