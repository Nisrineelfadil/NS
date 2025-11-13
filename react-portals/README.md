# Nisrine School - React Portals

Modern React rebuild of the Student and Teacher portals with 100% feature parity.

## 🎯 What's Included

- ✅ **Student Portal** - Students view grades, messages, statistics
- ✅ **Teacher Portal** - Teachers upload/manage grades for students
- ❌ **Student Management** - NOT included (keep using existing admin panel)

## 📦 Installation

```bash
cd react-portals
npm install
```

## 🚀 Development

```bash
# Start React dev server (runs on port 5173)
npm run dev

# In another terminal, start the backend server
cd ..
node server.js
```

The React app will proxy API requests to `http://localhost:3000` automatically.

## 🏗️ Project Structure

```
src/
├── components/
│   └── common/          # Shared components
│       ├── Header.jsx
│       ├── Modal.jsx
│       └── Loading.jsx
├── pages/
│   ├── StudentPortal/   # Student portal page & components
│   │   ├── StudentPortal.jsx
│   │   └── components/
│   │       ├── LoginForm.jsx
│   │       ├── StatsCards.jsx
│   │       ├── GradesFilters.jsx
│   │       ├── GradesTable.jsx
│   │       └── MessagesPanel.jsx
│   └── TeacherPortal/   # Teacher portal page & components
│       ├── TeacherPortal.jsx
│       └── components/
│           ├── LoginForm.jsx
│           ├── FormationSelector.jsx
│           ├── GroupSelector.jsx
│           ├── StudentsGrid.jsx
│           └── GradeModal.jsx
├── services/
│   └── api.js           # API service layer
├── context/
│   └── AuthContext.jsx  # Authentication state
└── main.jsx             # App entry point
```

## 🔌 API Integration

All API calls use the existing backend at `/api/*`:

- **Student API**: `/api/grades/student/*`
- **Teacher API**: `/api/grades/teacher/*`
- **No changes to backend required!**

## 🎨 Features

### Student Portal
- ✅ Login with school email
- ✅ View all grades with filters (formation, semester, year)
- ✅ Grade statistics (total, average)
- ✅ Color-coded grade letters (A-F)
- ✅ Messages panel with delete/clear
- ✅ Fully responsive mobile design

### Teacher Portal
- ✅ Login with @nisrineschool.com email
- ✅ Auto-select formation if teacher has only one
- ✅ Select formation and group
- ✅ View students in grid with photos
- ✅ Upload grades (4 exam types: Lesen, Hören, Schreiben, Sprechen)
- ✅ Edit/delete own grades
- ✅ Branch vs Language teacher filtering
- ✅ Fully responsive mobile design

## 🔒 Authentication

- JWT tokens stored in localStorage
- Auto-redirect on 401 errors
- Persistent login across page refreshes

## 📱 Mobile Responsive

- Optimized for all screen sizes
- Touch-friendly UI elements
- Collapsible tables on mobile
- Smooth animations

## 🚢 Build for Production

```bash
npm run build
```

Output will be in `dist/` folder.

## 🔄 Migration Path

1. **Phase 1** (Current): React portals run on port 5173
2. **Phase 2**: Test thoroughly with real data
3. **Phase 3**: Update server.js to serve React build
4. **Phase 4**: Deprecate old HTML portals

## 📝 Notes

- Backend API remains unchanged
- All existing features preserved
- Same design and styling
- Better performance with React
- Easier to add new features (Exam Tabs, QR Attendance)
