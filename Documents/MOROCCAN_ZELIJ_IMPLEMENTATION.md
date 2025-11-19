# Moroccan Zelij Design Implementation Guide

## Overview
Add traditional Moroccan Zelij tile patterns as decorative corner elements throughout the website to give an authentic Moroccan cultural touch.

## Available Zelij Designs

You have 7 beautiful Zelij patterns:

### Corner Designs (for corners):
1. **corner-red-zelij.png** - Red Moroccan pattern
2. **corner-gold-zelij.png** - Gold Moroccan pattern
3. **gold-zelij.png** - Gold variant
4. **red-zelij.png** - Red variant

### Single Icons (for accents):
5. **single-gold-zelij.png** - Gold star pattern
6. **single-red-zelij.png** - Red star pattern

## Implementation Plan

### Where to Use Zelij Designs

#### 🎯 **Top Right Corners** (Main decorations)
- ✅ Hero Section - Gold Zelij
- ✅ Services Section - Red Zelij
- ✅ About Section - Gold Zelij
- ✅ Student Life Section - Red Zelij
- ✅ Contact Section - Gold Zelij
- ✅ Ratings Section - Red Zelij

#### 🎯 **Bottom Left Corners** (Balance)
- ✅ Services Section - Gold Zelij (rotated)
- ✅ About Section - Red Zelij (rotated)
- ✅ Student Life Section - Gold Zelij (rotated)
- ✅ Contact Section - Red Zelij (rotated)
- ✅ Ratings Section - Gold Zelij (rotated)

#### 🎯 **Section Headers** (Small accents)
- ✅ All section titles - Alternating gold/red star icons

#### 🎯 **Footer**
- ✅ Top left corner - Gold Zelij
- ✅ Top right corner - Red Zelij

## Visual Layout

```
┌─────────────────────────────────────┐
│ 🌟 Hero Section                  🔶 │ ← Gold corner
│                                     │
│         NISRINE SCHOOL              │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🌟 Services Section              🔴 │ ← Red corner
│                                     │
│    [Service Cards]                  │
│                                     │
│ 🔶                                  │ ← Gold corner (bottom left)
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🌟 About Section                 🔶 │ ← Gold corner
│                                     │
│    [About Content]                  │
│                                     │
│ 🔴                                  │ ← Red corner (bottom left)
└─────────────────────────────────────┘

... and so on for all sections
```

## Design Specifications

### Corner Decorations:
- **Size**: 200-250px (desktop), 100-150px (mobile)
- **Opacity**: 0.1-0.15 (subtle, not overpowering)
- **Position**: Absolute positioning in corners
- **Z-index**: Behind content (z-index: 0-1)
- **Rotation**: Bottom corners rotated 180°

### Single Icons:
- **Size**: 50px (desktop), 35px (mobile)
- **Opacity**: 0.2
- **Position**: Above section headers
- **Alternating**: Gold and red for visual variety

### Color Scheme:
- **Gold Zelij**: Warm, welcoming sections (Hero, About, Contact)
- **Red Zelij**: Active, service sections (Services, Student Life, Ratings)

## Installation Steps

### Step 1: Add CSS File to HTML

Add this line to `index.html` in the `<head>` section (after other CSS files):

```html
<link rel="stylesheet" href="css/moroccan-zelij.css">
```

**Location in file:**
```html
<link rel="stylesheet" href="css/style.css">
<link rel="stylesheet" href="css/simple-slider.css">
<link rel="stylesheet" href="css/language-switcher.css">
<link rel="stylesheet" href="css/portal-access.css">
<link rel="stylesheet" href="css/student-life.css">
<link rel="stylesheet" href="css/registration-modal.css">
<link rel="stylesheet" href="css/ratings.css">
<link rel="stylesheet" href="css/moroccan-zelij.css"> <!-- ADD THIS LINE -->
```

### Step 2: Verify Image Files

Make sure these files exist in your `Img` folder:
- ✅ `corner-gold-zelij.png`
- ✅ `corner-red-zelij.png`
- ✅ `single-gold-zelij.png`
- ✅ `single-red-zelij.png`

If you have different file names (like `gold-zelij.png` instead of `corner-gold-zelij.png`), you'll need to either:
1. Rename the files to match, OR
2. Update the CSS file paths

### Step 3: Test and Adjust

1. **Refresh your browser**: Ctrl + F5
2. **Check each section**: Scroll through the page
3. **Adjust opacity**: If too visible or too subtle, modify in CSS
4. **Adjust size**: Change width/height values if needed

## Customization Options

### Adjust Opacity (Visibility)

In `moroccan-zelij.css`, change the `opacity` value:

```css
/* More visible */
opacity: 0.2;

/* More subtle */
opacity: 0.08;

/* Default */
opacity: 0.12;
```

### Adjust Size

Change `width` and `height`:

```css
/* Larger */
width: 300px;
height: 300px;

/* Smaller */
width: 150px;
height: 150px;

/* Default */
width: 200px;
height: 200px;
```

### Change Colors

Swap gold and red patterns:

```css
/* Use red instead of gold */
background-image: url('../Img/corner-red-zelij.png');

/* Use gold instead of red */
background-image: url('../Img/corner-gold-zelij.png');
```

### Disable Specific Decorations

Comment out sections you don't want:

```css
/* Disable hero decoration */
/*
.hero::before {
    content: '';
    ...
}
*/
```

## Responsive Behavior

### Desktop (>768px):
- Full size decorations (200-250px)
- Normal opacity (0.1-0.15)

### Tablet (768px):
- Medium decorations (150px)
- Slightly reduced opacity (0.1)

### Mobile (<480px):
- Small decorations (100px)
- More subtle opacity (0.08)

## RTL Support (Arabic)

The CSS automatically flips decorations for Arabic (RTL) layout:
- Top right becomes top left
- Bottom left becomes bottom right
- Patterns are mirrored

## Performance Considerations

### Optimization:
- ✅ Uses CSS pseudo-elements (no extra HTML)
- ✅ Background images (cached by browser)
- ✅ No JavaScript required
- ✅ Minimal performance impact

### Image Optimization:
Make sure Zelij images are optimized:
- **Format**: PNG with transparency
- **Size**: Under 50 KB each
- **Dimensions**: 500x500px max

## Troubleshooting

### Decorations not showing?
1. Check CSS file is linked in HTML
2. Verify image paths are correct
3. Check browser console for errors
4. Clear browser cache (Ctrl + F5)

### Decorations too visible?
- Reduce `opacity` value in CSS
- Reduce `width` and `height`

### Decorations too subtle?
- Increase `opacity` value
- Increase `width` and `height`
- Use darker/brighter images

### Decorations overlapping content?
- Reduce size
- Adjust `z-index` to lower value
- Add more padding to sections

## Alternative Placements

If you want to try different positions:

### Center Top:
```css
.section::before {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
}
```

### All Four Corners:
```css
.section::before { top: 0; right: 0; }
.section::after { top: 0; left: 0; }
/* Add more pseudo-elements with wrapper divs */
```

### Behind Content (Watermark):
```css
.section::before {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.03;
    width: 400px;
    height: 400px;
}
```

## Color Variations

You can create different moods:

### Warm (Gold dominant):
- Use gold for most sections
- Red for accents only

### Bold (Red dominant):
- Use red for most sections
- Gold for accents only

### Balanced (Current):
- Alternating gold and red
- Creates visual rhythm

## Examples of Use

### Subtle (Recommended):
```css
opacity: 0.1;
width: 200px;
```
**Effect**: Elegant, professional, doesn't distract

### Medium:
```css
opacity: 0.15;
width: 250px;
```
**Effect**: More visible, cultural emphasis

### Bold:
```css
opacity: 0.25;
width: 300px;
```
**Effect**: Strong Moroccan identity, very visible

## Final Checklist

- [ ] CSS file created (`moroccan-zelij.css`)
- [ ] CSS file linked in `index.html`
- [ ] Zelij images in `Img` folder
- [ ] Image file names match CSS paths
- [ ] Browser refreshed (Ctrl + F5)
- [ ] All sections checked
- [ ] Mobile view tested
- [ ] RTL (Arabic) tested
- [ ] Opacity adjusted to preference
- [ ] Size adjusted to preference

## Status

✅ **CSS FILE CREATED**: `css/moroccan-zelij.css`  
📝 **NEXT STEP**: Add CSS link to `index.html`  
🎨 **RESULT**: Authentic Moroccan cultural touch throughout the website!

## Preview

The Zelij patterns will add:
- ✨ Authentic Moroccan cultural identity
- 🎨 Visual interest and elegance
- 🏛️ Traditional craftsmanship feel
- 🇲🇦 Connection to Moroccan heritage
- 💎 Subtle luxury and sophistication

**Perfect for a Moroccan-based German language school!** 🇲🇦🇩🇪
