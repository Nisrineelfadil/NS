# ⚡ Quick Start - React Portals

## 🎯 What This Is

React rebuild of Student Portal and Teacher Portal with **100% feature parity**.

- ✅ Student Portal - View grades, messages, statistics
- ✅ Teacher Portal - Upload/manage grades
- ❌ Student Management - **NOT included** (keep using existing admin panel)

---

## 🚀 3-Step Setup

### 1️⃣ Install Dependencies

```bash
cd react-portals
npm install
```

### 2️⃣ Start Backend (Terminal 1)

```bash
cd ..
node server.js
```

✅ Backend running on `http://localhost:3000`

### 3️⃣ Start React App (Terminal 2)

```bash
cd react-portals
npm run dev
```

✅ React app running on `http://localhost:5173`

---

## 🌐 Access URLs

| Portal | URL | Login |
|--------|-----|-------|
| **Student Portal** | http://localhost:5173/ | schoolEmail + password |
| **Teacher Portal** | http://localhost:5173/teacher | @nisrineschool.com email + password |

---

## 🧪 Quick Test

### Test Student Portal:
1. Go to http://localhost:5173/
2. Login with any student credentials
3. View grades, use filters, check messages

### Test Teacher Portal:
1. Go to http://localhost:5173/teacher
2. Login with teacher credentials
3. Select formation → group → student
4. Upload/edit grades

---

## 📱 Features

### Student Portal
- ✅ Login & authentication
- ✅ View all grades
- ✅ Filter by formation/semester/year
- ✅ Statistics (total, average)
- ✅ Color-coded grades (A-F)
- ✅ Messages panel
- ✅ Mobile responsive

### Teacher Portal
- ✅ Login & authentication
- ✅ Formation selector (auto-select if 1)
- ✅ Group selector
- ✅ Students grid with photos
- ✅ Upload grades (4 exam types)
- ✅ Edit/delete grades
- ✅ Branch vs Language filtering
- ✅ Mobile responsive

---

## 🔧 Tech Stack

- **React 18** - UI framework
- **Vite** - Dev server & build tool
- **React Router** - Navigation
- **Axios** - API calls
- **Context API** - State management
- **CSS** - Styling (same design as original)

---

## 🎨 Design

**100% identical** to original portals:
- Same colors (golden #FFCC00 theme)
- Same layout and spacing
- Same animations
- Same responsive behavior
- Same user experience

---

## 🔌 Backend

**No changes required!** Uses existing:
- `/api/grades/student/*` - Student endpoints
- `/api/grades/teacher/*` - Teacher endpoints
- Same database
- Same authentication
- Same business logic

---

## 📦 Build for Production

```bash
npm run build
```

Output in `dist/` folder - ready to deploy!

---

## 🆘 Troubleshooting

**React app won't start?**
- Run `npm install` first
- Check Node.js version (need 16+)

**API calls failing?**
- Make sure backend is running on port 3000
- Check browser console for errors

**Login not working?**
- Verify backend is connected to database
- Check credentials are correct

**Styles look wrong?**
- Hard refresh (Ctrl + Shift + R)
- Clear browser cache

---

## ✨ What's Next?

After testing Phase 1:
1. ✅ Verify all features work
2. 🔜 Add Exam Tabs feature
3. 🔜 Add QR Attendance system
4. 🔜 Deploy to production

---

**Ready to test!** 🎉
