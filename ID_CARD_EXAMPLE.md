# Student ID Card Generator - Complete Example

## 📋 Example Student Data

```javascript
const exampleStudent = {
    _id: "507f1f77bcf86cd799439011",
    fullName: "Ahmed Ben Ali",
    schoolEmail: "ahmedbenali@nisrineschool.com",
    emailPassword: "Nisrine2025!",
    photoPath: "uploads/students/ahmed-ben-ali.jpg",
    phones: ["0612345678", "0698765432"],
    formation: ["Allemand", "Anglais"],
    filiere: ["Informatique"],
    groupName: "Group A - Allemand",
    season: "2025-2026",
    seasonName: "Academic Year 2025-2026",
    paymentStatus: "paid",
    status: "active",
    dateOfBirth: "2000-01-15",
    address: "123 Rue Mohammed V",
    city: "Casablanca",
    cin: "AB123456"
};
```

---

## 🎨 Generated Card - Front Side

```
┌───────────────────────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════════════════════╗ │
│ ║  🏫  NISRINE SCHOOL                                       ║ │
│ ╚═══════════════════════════════════════════════════════════╝ │
│                                                               │
│  ┌─────────────────────────────────┐  ┌──────────────────┐  │
│  │                                 │  │                  │  │
│  │  Étudiant ID: 507f1f77bcf8      │  │   ┌──────────┐  │  │
│  │                                 │  │   │          │  │  │
│  │  Filière: Informatique          │  │   │  [Photo] │  │  │
│  │                                 │  │   │  Ahmed   │  │  │
│  │  Téléphone: 0612345678          │  │   │          │  │  │
│  │                                 │  │   └──────────┘  │  │
│  │  Session: 2025-2026             │  │                  │  │
│  │                                 │  │  Ahmed Ben Ali   │  │
│  │                                 │  │                  │  │
│  │                                 │  │  ▐▌▐ ▌▐▌▐▌▐▌▐   │  │
│  │                                 │  │  (Barcode)       │  │
│  │                                 │  │                  │  │
│  └─────────────────────────────────┘  └──────────────────┘  │
│                                                               │
│  Signature Autorisée                                          │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Front Side - Actual Display

**Header Section** (Blue Gradient: #4a5fc1 → #3949ab)
- Logo: School logo (35px circle)
- Text: "NISRINE SCHOOL" (white, bold, uppercase)

**Body Section** (Light Gray: #f8f9fa)

**Left Column:**
```
Étudiant ID:    507f1f77bcf8
Filière:        Informatique
Téléphone:      0612345678
Session:        2025-2026
```

**Right Column:**
```
┌────────────────┐
│                │
│   [Photo]      │  ← 85px × 100px
│   Ahmed        │
│                │
└────────────────┘
   Ahmed Ben Ali    ← Name (0.8rem, bold)
   
   ▐▌▐ ▌▐▌▐▌▐▌▐    ← Barcode (CODE128)
```

**Footer:**
```
Signature Autorisée (italic, small, gray)
```

---

## 🎨 Generated Card - Back Side

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                                                               │
│              INFORMATIONS DE CONNEXION                        │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │   EMAIL SCOLAIRE                                        │ │
│  │   ahmedbenali@nisrineschool.com                         │ │
│  │                                                         │ │
│  │   MOT DE PASSE                                          │ │
│  │   Nisrine2025!                                          │ │
│  │                                                         │ │
│  │   ┌─────────────────────────────────────────────────┐  │ │
│  │   │                                                 │  │ │
│  │   │          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                   │  │ │
│  │   │          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                   │  │ │
│  │   │          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                   │  │ │
│  │   │          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                   │  │ │
│  │   │          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                   │  │ │
│  │   │                                                 │  │ │
│  │   │          QR Code (100x100px)                    │  │ │
│  │   │          Links to student profile               │  │ │
│  │   │                                                 │  │ │
│  │   └─────────────────────────────────────────────────┘  │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Back Side - Actual Display

**Background:** Purple gradient (#667eea → #764ba2 → #f093fb)

**Title:** "INFORMATIONS DE CONNEXION" (white, bold, uppercase)

**Info Card:** (White background with shadow)
```
┌─────────────────────────────────┐
│ EMAIL SCOLAIRE                  │ ← Label (blue, small, uppercase)
│ ahmedbenali@nisrineschool.com   │ ← Value (dark, monospace)
│                                 │
│ MOT DE PASSE                    │ ← Label (blue, small, uppercase)
│ Nisrine2025!                    │ ← Value (dark, monospace)
│                                 │
│ ─────────────────────────────── │ ← Divider
│                                 │
│        [QR Code]                │ ← 100x100px QR code
│     (Scan to view profile)      │
│                                 │
└─────────────────────────────────┘
```

**QR Code Data:**
```
https://yourdomain.com/student-profile/507f1f77bcf86cd799439011
```

---

## 💻 Code Example - Opening the Card

### From JavaScript

```javascript
// Example 1: Direct call with student object
const student = {
    _id: "507f1f77bcf86cd799439011",
    fullName: "Ahmed Ben Ali",
    schoolEmail: "ahmedbenali@nisrineschool.com",
    emailPassword: "Nisrine2025!",
    photoPath: "uploads/students/ahmed-ben-ali.jpg",
    phones: ["0612345678", "0698765432"],
    formation: ["Allemand", "Anglais"],
    filiere: ["Informatique"],
    groupName: "Group A - Allemand",
    season: "2025-2026"
};

openIDCardModal(student);
```

### From HTML Button

```html
<!-- Method 1: Inline onclick -->
<button onclick="openIDCardModal({
    _id: '507f1f77bcf86cd799439011',
    fullName: 'Ahmed Ben Ali',
    schoolEmail: 'ahmedbenali@nisrineschool.com',
    emailPassword: 'Nisrine2025!',
    photoPath: 'uploads/students/ahmed-ben-ali.jpg',
    phones: ['0612345678', '0698765432'],
    formation: ['Allemand', 'Anglais'],
    filiere: ['Informatique'],
    groupName: 'Group A - Allemand',
    season: '2025-2026'
})">
    <i class="fas fa-id-card"></i> Carte d'Étudiant
</button>

<!-- Method 2: With JSON.stringify (safer for complex objects) -->
<button onclick='openIDCardModal(<?php echo json_encode($student); ?>)'>
    <i class="fas fa-id-card"></i> Carte d'Étudiant
</button>
```

---

## 🎯 Complete HTML Structure Generated

```html
<div class="id-card-modal active">
    <div class="id-card-modal-content">
        <!-- Header -->
        <div class="id-card-header">
            <h2>
                <i class="fas fa-id-card"></i> 
                Carte d'Étudiant
            </h2>
            <button class="id-card-close" onclick="closeIDCardModal()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <!-- Cards Container -->
        <div class="id-card-container">
            <!-- Front Side -->
            <div class="id-card">
                <div class="id-card-front">
                    <div class="id-card-front-header">
                        <img src="Img/logo.png" alt="Logo">
                        <div class="school-name">Nisrine School</div>
                    </div>
                    <div class="id-card-front-body">
                        <div class="id-card-info">
                            <div class="id-card-info-row">
                                <span class="id-card-info-label">Étudiant ID:</span>
                                <span class="id-card-info-value">507f1f77bcf8</span>
                            </div>
                            <div class="id-card-info-row">
                                <span class="id-card-info-label">Filière:</span>
                                <span class="id-card-info-value">Informatique</span>
                            </div>
                            <div class="id-card-info-row">
                                <span class="id-card-info-label">Téléphone:</span>
                                <span class="id-card-info-value">0612345678</span>
                            </div>
                            <div class="id-card-info-row">
                                <span class="id-card-info-label">Session:</span>
                                <span class="id-card-info-value">2025-2026</span>
                            </div>
                        </div>
                        <div class="id-card-photo-container">
                            <img src="uploads/students/ahmed-ben-ali.jpg" 
                                 alt="Photo" 
                                 class="id-card-photo">
                            <div class="id-card-name">Ahmed Ben Ali</div>
                            <div class="id-card-barcode">
                                <svg id="barcode-507f1f77bcf86cd799439011"></svg>
                            </div>
                        </div>
                    </div>
                    <div class="id-card-signature">Signature Autorisée</div>
                </div>
            </div>
            
            <!-- Back Side -->
            <div class="id-card">
                <div class="id-card-back">
                    <div class="id-card-back-title">
                        Informations de Connexion
                    </div>
                    <div class="id-card-back-info">
                        <div class="id-card-back-row">
                            <div class="id-card-back-label">Email Scolaire</div>
                            <div class="id-card-back-value">
                                ahmedbenali@nisrineschool.com
                            </div>
                        </div>
                        <div class="id-card-back-row">
                            <div class="id-card-back-label">Mot de Passe</div>
                            <div class="id-card-back-value">Nisrine2025!</div>
                        </div>
                        <div class="id-card-qr">
                            <canvas id="qrcode-507f1f77bcf86cd799439011"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="id-card-actions">
            <button class="id-card-btn" onclick="printIDCard()">
                <i class="fas fa-print"></i>
                Imprimer la Carte
            </button>
            <button class="id-card-btn id-card-btn-secondary" 
                    onclick="downloadIDCardPDF()">
                <i class="fas fa-download"></i>
                Télécharger PDF
            </button>
        </div>
    </div>
</div>
```

---

## 🔧 JavaScript Functions Called

### 1. Generate Barcode
```javascript
setTimeout(() => {
    JsBarcode("#barcode-507f1f77bcf86cd799439011", "507f1f77bcf8", {
        format: "CODE128",
        width: 1.5,
        height: 30,
        displayValue: false,
        margin: 0
    });
}, 100);
```

### 2. Generate QR Code
```javascript
setTimeout(() => {
    const qrData = "https://yourdomain.com/student-profile/507f1f77bcf86cd799439011";
    const canvas = document.getElementById("qrcode-507f1f77bcf86cd799439011");
    
    QRCode.toCanvas(canvas, qrData, {
        width: 100,
        height: 100,
        margin: 1,
        color: {
            dark: '#1f2937',
            light: '#ffffff'
        }
    }, function (error) {
        if (error) console.error('QR Code generation error:', error);
    });
}, 100);
```

---

## 📱 Responsive Behavior

### Desktop (1920x1080)
```
Modal: 900px width
Cards: Side by side (350px each)
Buttons: In a row
Font: Normal size
```

### Tablet (768x1024)
```
Modal: 90% width
Cards: Side by side (smaller)
Buttons: In a row
Font: Normal size
```

### Mobile (375x667)
```
Modal: 95% width
Cards: Stacked vertically (320px each)
Buttons: Stacked vertically
Font: Slightly smaller
```

---

## 🖨️ Print Output Example

### Print Preview
```
┌─────────────────────────────────────────────────────────────┐
│                        PAGE 1                               │
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐       │
│  │                     │    │                     │       │
│  │    FRONT SIDE       │    │    BACK SIDE        │       │
│  │                     │    │                     │       │
│  │  [Full card design] │    │  [Full card design] │       │
│  │                     │    │                     │       │
│  │                     │    │                     │       │
│  └─────────────────────┘    └─────────────────────┘       │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Print Settings:**
- Paper: A4 or Card Stock
- Orientation: Landscape
- Margins: Default
- Scale: 100%
- Color: Color (recommended)

---

## 📥 PDF Output Example

### PDF File Structure
```
Carte_Etudiant_Ahmed_Ben_Ali.pdf
├── Page 1 (A4 Landscape)
│   ├── Front Card (Left)
│   │   ├── Header (Blue gradient)
│   │   ├── Student info
│   │   ├── Photo
│   │   └── Barcode
│   └── Back Card (Right)
│       ├── Title (Purple gradient)
│       ├── Email
│       ├── Password
│       └── QR Code
└── Metadata
    ├── Title: "Student ID Card - Ahmed Ben Ali"
    ├── Author: "Nisrine School"
    ├── Creator: "Student Management System"
    └── Creation Date: 2025-10-30
```

**PDF Properties:**
- Format: A4 Landscape
- Quality: High (98% JPEG)
- Size: ~200-500 KB
- Margins: 10mm all sides
- Fonts: Embedded

---

## 🎨 CSS Classes Used

### Modal Classes
```css
.id-card-modal              /* Modal overlay */
.id-card-modal.active       /* Active state */
.id-card-modal-content      /* Modal container */
.id-card-header             /* Header section */
.id-card-close              /* Close button */
.id-card-container          /* Cards container */
.id-card-actions            /* Action buttons */
```

### Card Classes
```css
.id-card                    /* Card wrapper */
.id-card-front              /* Front side */
.id-card-front-header       /* Blue header */
.id-card-front-body         /* Main content */
.id-card-info               /* Info section */
.id-card-info-row           /* Info row */
.id-card-info-label         /* Label text */
.id-card-info-value         /* Value text */
.id-card-photo-container    /* Photo section */
.id-card-photo              /* Photo image */
.id-card-name               /* Student name */
.id-card-barcode            /* Barcode container */
.id-card-signature          /* Signature line */
.id-card-back               /* Back side */
.id-card-back-title         /* Back title */
.id-card-back-info          /* Info card */
.id-card-back-row           /* Info row */
.id-card-back-label         /* Label text */
.id-card-back-value         /* Value text */
.id-card-qr                 /* QR code section */
```

### Button Classes
```css
.id-card-btn                /* Primary button */
.id-card-btn-secondary      /* Secondary button */
```

---

## ✅ Testing Checklist

### Functionality Tests
- [x] Modal opens from students grid
- [x] Modal opens from student profile
- [x] Front side displays correctly
- [x] Back side displays correctly
- [x] Barcode generates
- [x] QR code generates
- [x] Print button works
- [x] PDF download works
- [x] Modal closes with X button
- [x] Modal closes with ESC key
- [x] Modal closes on outside click

### Data Tests
- [x] Student ID displays (first 12 chars)
- [x] Full name displays
- [x] Branch displays or "Aucune formation"
- [x] Phone number displays
- [x] Season displays
- [x] Photo displays or default avatar
- [x] School email displays
- [x] Password displays
- [x] QR code links to correct URL

### Design Tests
- [x] Colors match reference
- [x] Layout matches reference
- [x] Fonts are correct
- [x] Spacing is correct
- [x] All text in French
- [x] Logo displays
- [x] Responsive on mobile
- [x] Responsive on tablet
- [x] Print layout correct

---

## 🎉 Success!

The Student ID Card Generator is now fully functional and ready to use. This example demonstrates all features working together to create professional, printable student ID cards that match the exact design specifications.

**Key Achievements:**
- ✅ Exact design match
- ✅ All text in French
- ✅ Professional appearance
- ✅ Full functionality
- ✅ Easy to use
- ✅ Print and PDF ready

---

**For more information, see:**
- `STUDENT_ID_CARD_GENERATOR.md` - Full documentation
- `ID_CARD_QUICK_START.md` - Quick reference
- `ID_CARD_USAGE_GUIDE.md` - Visual guide
- `ID_CARD_IMPLEMENTATION_SUMMARY.md` - Technical details
