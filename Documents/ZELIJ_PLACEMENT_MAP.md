# Moroccan Zelij Placement Map

## Visual Guide - Where Each Design Appears

### 📍 **HERO SECTION** (Home)
```
┌─────────────────────────────────────────────┐
│                                    🔶 GOLD  │ ← Top Right Corner
│                                             │   (250px, opacity: 0.15)
│         NISRINE SCHOOL                      │
│    German Language Center in Fez            │
│                                             │
│         [Register Now] [Our Services]       │
│                                             │
└─────────────────────────────────────────────┘
```
**Decoration**: Gold corner Zelij (warm welcome)

---

### 📍 **SERVICES SECTION**
```
┌─────────────────────────────────────────────┐
│ ⭐ Our Services                    🔴 RED   │ ← Top Right Corner
│                                             │   (200px, opacity: 0.12)
│   [German Courses] [Visa] [Culture]        │
│   [Nursing] [Hotel] [Education]            │
│                                             │
│ 🔶 GOLD                                     │ ← Bottom Left Corner
└─────────────────────────────────────────────┘   (200px, rotated 180°)
```
**Decorations**: 
- Top right: Red corner (active section)
- Bottom left: Gold corner (balance)
- Header: Red star icon

---

### 📍 **ABOUT SECTION**
```
┌─────────────────────────────────────────────┐
│ ⭐ Who Are We                      🔶 GOLD  │ ← Top Right Corner
│                                             │   (220px, opacity: 0.1)
│   [About Text]        [About Image]        │
│                                             │
│   • Professional teachers                   │
│   • Modern facilities                       │
│                                             │
│ 🔴 RED                                      │ ← Bottom Left Corner
└─────────────────────────────────────────────┘   (220px, rotated 180°)
```
**Decorations**:
- Top right: Gold corner (warm, welcoming)
- Bottom left: Red corner (balance)
- Header: Gold star icon

---

### 📍 **STUDENT LIFE SECTION**
```
┌─────────────────────────────────────────────┐
│ ⭐ Student Life                    🔴 RED   │ ← Top Right Corner
│                                             │   (200px, opacity: 0.1)
│   [Photo Gallery]                           │
│   [Student Activities]                      │
│   [Campus Life]                             │
│                                             │
│ 🔶 GOLD                                     │ ← Bottom Left Corner
└─────────────────────────────────────────────┘   (200px, rotated 180°)
```
**Decorations**:
- Top right: Red corner (vibrant section)
- Bottom left: Gold corner (balance)
- Header: Red star icon

---

### 📍 **CONTACT SECTION**
```
┌─────────────────────────────────────────────┐
│ ⭐ Contact Us                      🔶 GOLD  │ ← Top Right Corner
│                                             │   (220px, opacity: 0.12)
│   [Contact Form]      [Map]                 │
│                                             │
│   Name: ___________                         │
│   Email: __________                         │
│   Message: ________                         │
│                                             │
│ 🔴 RED                                      │ ← Bottom Left Corner
└─────────────────────────────────────────────┘   (220px, rotated 180°)
```
**Decorations**:
- Top right: Gold corner (welcoming)
- Bottom left: Red corner (balance)
- Header: Gold star icon

---

### 📍 **RATINGS SECTION**
```
┌─────────────────────────────────────────────┐
│ ⭐ Rate Us                         🔴 RED   │ ← Top Right Corner
│                                             │   (200px, opacity: 0.1)
│   ⭐⭐⭐⭐⭐                                  │
│                                             │
│   [Submit Rating]                           │
│   [View Reviews]                            │
│                                             │
│ 🔶 GOLD                                     │ ← Bottom Left Corner
└─────────────────────────────────────────────┘   (200px, rotated 180°)
```
**Decorations**:
- Top right: Red corner (active section)
- Bottom left: Gold corner (balance)
- Header: Red star icon

---

### 📍 **FOOTER**
```
┌─────────────────────────────────────────────┐
│ 🔶 GOLD                           🔴 RED    │ ← Both Top Corners
│                                             │   (180px each, opacity: 0.08)
│   NISRINE SCHOOL                            │
│   [Links] [Services] [Contact]              │
│                                             │
│   © 2024 Nisrine School                     │
└─────────────────────────────────────────────┘
```
**Decorations**:
- Top left: Gold corner
- Top right: Red corner
- Subtle, elegant finish

---

## Color Pattern Summary

### 🔶 **GOLD ZELIJ** (Warm & Welcoming)
Used in:
- Hero Section (top right)
- About Section (top right)
- Contact Section (top right)
- Services Section (bottom left)
- Student Life Section (bottom left)
- Ratings Section (bottom left)
- Footer (top left)

**Purpose**: Creates warm, welcoming atmosphere

### 🔴 **RED ZELIJ** (Active & Vibrant)
Used in:
- Services Section (top right)
- Student Life Section (top right)
- Ratings Section (top right)
- About Section (bottom left)
- Contact Section (bottom left)
- Footer (top right)

**Purpose**: Adds energy and vibrancy

### ⭐ **STAR ICONS** (Section Headers)
- Alternating gold and red
- Small accent above each section title
- Adds visual rhythm

---

## Opacity Levels

| Element | Opacity | Visibility |
|---------|---------|------------|
| Hero corners | 0.15 | Most visible (welcome) |
| Section corners | 0.10-0.12 | Subtle elegance |
| Footer corners | 0.08 | Very subtle |
| Star icons | 0.20 | Gentle accent |

---

## Size Breakdown

### Desktop (>768px):
- Hero: 250px
- Sections: 200-220px
- Footer: 180px
- Stars: 50px

### Tablet (768px):
- All corners: 150px
- Footer: 120px
- Stars: 40px

### Mobile (<480px):
- All corners: 100px
- Footer: 80px
- Stars: 35px

---

## Rotation Pattern

### Top Right Corners:
- **No rotation** (0°)
- Pattern flows naturally from corner

### Bottom Left Corners:
- **Rotated 180°**
- Creates mirror effect
- Balances the design

---

## Z-Index Hierarchy

```
Content (text, images)     → z-index: 2+
Hero decoration            → z-index: 1
Other decorations          → z-index: 0
Background                 → z-index: -1
```

**Result**: Decorations stay behind content, never overlap text or images

---

## RTL (Arabic) Adjustments

When language is set to Arabic:

```
NORMAL (LTR):                RTL (Arabic):
┌──────────────┐            ┌──────────────┐
│           🔶 │            │ 🔶           │
│              │            │              │
│              │            │              │
│ 🔴           │            │           🔴 │
└──────────────┘            └──────────────┘
```

**Automatic flip**: Decorations mirror for RTL layout

---

## Visual Balance

### Alternating Pattern:
```
Hero:         Gold (right)
Services:     Red (right) + Gold (left)
About:        Gold (right) + Red (left)
Student Life: Red (right) + Gold (left)
Contact:      Gold (right) + Red (left)
Ratings:      Red (right) + Gold (left)
Footer:       Gold (left) + Red (right)
```

**Result**: Perfect visual rhythm and balance

---

## Cultural Significance

### Zelij Tiles:
- Traditional Moroccan mosaic tilework
- Geometric Islamic art
- Represents craftsmanship and heritage
- Adds authentic Moroccan identity

### Color Meanings:
- **Gold**: Warmth, hospitality, welcome
- **Red**: Energy, passion, Morocco's national color

---

## File Requirements

Make sure these files exist in `Img/` folder:

```
Img/
├── corner-gold-zelij.png   (or gold-zelij.png)
├── corner-red-zelij.png    (or red-zelij.png)
├── single-gold-zelij.png
└── single-red-zelij.png
```

**If file names are different**, update paths in `moroccan-zelij.css`

---

## Quick Reference

| Section | Top Right | Bottom Left | Header Icon |
|---------|-----------|-------------|-------------|
| Hero | 🔶 Gold | - | - |
| Services | 🔴 Red | 🔶 Gold | 🔴 Red |
| About | 🔶 Gold | 🔴 Red | 🔶 Gold |
| Student Life | 🔴 Red | 🔶 Gold | 🔴 Red |
| Contact | 🔶 Gold | 🔴 Red | 🔶 Gold |
| Ratings | 🔴 Red | 🔶 Gold | 🔴 Red |
| Footer | 🔶 Gold (left) | 🔴 Red (right) | - |

---

## Expected Result

✨ **Subtle Moroccan elegance throughout the website**  
🎨 **Professional and culturally authentic**  
🇲🇦 **Perfect for a Moroccan-based school**  
💎 **Sophisticated without being overwhelming**

**The Zelij patterns add a distinctive Moroccan identity while maintaining a professional, modern look!** 🏛️✨
