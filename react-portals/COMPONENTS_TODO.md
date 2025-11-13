# Remaining Components to Create

## Teacher Portal Components

### 1. GroupSelector.jsx + .css
- Dropdown to select group
- Shows group name and student count
- Filters based on selected formation

### 2. StudentsGrid.jsx + .css
- Grid of student cards
- Shows student photo, name, email
- Module boxes for each exam type (Lesen, Hören, Schreiben, Sprechen)
- Click to open grade modal
- Shows existing grades with color coding

### 3. GradeModal.jsx + .css
- Modal to upload/edit grades
- Form with: exam type, score, max score, semester, academic year, exam date, comments
- Submit to create/update grade
- Delete existing grade option
- Validation

## Main App Files

### 4. main.jsx
- React entry point
- Router setup
- AuthProvider wrapper

### 5. App.jsx
- Main app component
- Route definitions:
  - / → Student Portal
  - /teacher → Teacher Portal
- Protected routes

### 6. Global styles (index.css)
- Reset styles
- Global variables
- Base typography

## Installation & Setup

After creating all components:

```bash
cd react-portals
npm install
npm run dev
```

Then test:
- Student login
- Teacher login
- Grade upload
- Grade viewing
- Filters
- Messages
- Mobile responsive

## Current Status

✅ Project structure
✅ API service layer
✅ Auth context
✅ Common components (Header, Modal, Loading)
✅ Student Portal (complete)
✅ Teacher Portal (partial - need GroupSelector, StudentsGrid, GradeModal)
⏳ Main app files (App.jsx, main.jsx)
⏳ Global styles
