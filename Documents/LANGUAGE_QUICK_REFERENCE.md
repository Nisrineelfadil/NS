# Language Quick Reference Guide

## Default Language: German (Deutsch) 🇩🇪

All Nisrine School systems now default to **German** as the primary language.

## Available Languages

1. **🇩🇪 Deutsch (German)** - DEFAULT
2. **🇬🇧 English**
3. **🇫🇷 Français (French)**
4. **🇲🇦 العربية (Arabic)**

## How to Change Language

### Main Website
1. Look for the globe icon (🌐) in the top navigation bar
2. Click to open the language dropdown
3. Select your preferred language:
   - 🇩🇪 Deutsch
   - 🇬🇧 English
   - 🇫🇷 Français
   - 🇲🇦 العربية

### Admin Panel
1. Find the language button in the top-right corner (shows "DE" by default)
2. Click to open the dropdown menu
3. Choose from: Deutsch, English, Français, or العربية
4. Interface updates immediately

### Student Portal
1. Open the Settings menu (gear icon ⚙️)
2. Select "Language" / "Sprache"
3. Choose your preferred language
4. Page reloads with new language

### Teacher Portal
1. Click the language selector in the top bar
2. Select from available languages
3. Interface updates instantly

### Student Management System
1. Language is automatically set to German
2. Can be changed via the language selector
3. Preference is saved for future sessions

## Language Codes

| Language | Code | Flag |
|----------|------|------|
| Deutsch  | de   | 🇩🇪   |
| English  | en   | 🇬🇧   |
| Français | fr   | 🇫🇷   |
| العربية  | ar   | 🇲🇦   |

## Troubleshooting

### Language Not Changing?
1. **Clear browser cache:** Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
2. **Hard refresh:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. **Check localStorage:** Open browser console (F12) and type: `localStorage.clear()`

### Wrong Language on First Visit?
- The system defaults to German
- Your browser's language preference is not automatically detected
- Simply change the language using the language selector

### Language Resets After Logout?
- This is normal behavior for security
- Select your preferred language after logging in
- It will be remembered for that session

### Missing Translations?
- Some new features may not have German translations yet
- The system will fall back to English for missing translations
- Report missing translations to the development team

## For Administrators

### Adding New Translations
1. **Main Website:** Edit `/js/languages.json`
2. **Admin Panel:** Edit `/js/languages.json` (admin section)
3. **Student Management:** Edit `/js/translations.js`
4. **Student Portal:** Edit `/translations/translations.json`
5. **React Portals:** Edit `/react-portals/src/context/LanguageContext.jsx`

### Translation File Locations
```
/js/languages.json                              # Main website & admin panel
/js/translations.js                             # Student management system
/translations/translations.json                 # Student portal
/react-portals/src/context/LanguageContext.jsx  # React portals
/js/cash-register-translations.js               # Cash register system
```

### Changing Default Language
To change the default language back to English or another language:

1. **Main Website:** Edit `js/main.js` line 223
   ```javascript
   const currentLang = localStorage.getItem('preferredLanguage') || 'de';
   // Change 'de' to 'en', 'fr', or 'ar'
   ```

2. **Admin Panel:** Edit `js/admin-dashboard.js` line 29
   ```javascript
   let currentLanguage = localStorage.getItem('adminLanguage') || 'de';
   // Change 'de' to 'en', 'fr', or 'ar'
   ```

3. **Student Portal:** Edit `js/student-portal.js` line 10
   ```javascript
   let currentLang = localStorage.getItem('language') || 'de';
   // Change 'de' to 'en', 'fr', or 'ar'
   ```

4. **Student Management:** Edit `js/translations.js` line 587
   ```javascript
   return localStorage.getItem('adminLanguage') || localStorage.getItem('selectedLanguage') || 'de';
   // Change 'de' to 'en', 'fr', or 'ar'
   ```

5. **React Portals:** Edit `react-portals/src/context/LanguageContext.jsx` line 225
   ```javascript
   const savedLanguage = localStorage.getItem('language') || 'de';
   // Change 'de' to 'en', 'fr', or 'ar'
   ```

## Common German Phrases in the System

### Navigation
- **Startseite** - Home
- **Dienstleistungen** - Services
- **Über uns** - About Us
- **Kontakt** - Contact

### Actions
- **Anmelden** - Login
- **Abmelden** - Logout
- **Speichern** - Save
- **Bearbeiten** - Edit
- **Löschen** - Delete
- **Suchen** - Search
- **Aktualisieren** - Refresh

### Status
- **Ausstehend** - Pending
- **Genehmigt** - Approved
- **Abgelehnt** - Rejected
- **Aktiv** - Active
- **Inaktiv** - Inactive

### Common Terms
- **Schüler** - Students
- **Lehrer** - Teachers
- **Noten** - Grades
- **Gruppen** - Groups
- **Nachrichten** - Messages
- **Einstellungen** - Settings
- **Dashboard** - Dashboard

## Support

For language-related issues or translation requests:
- Contact: info@nisrineschool.com
- Phone: +212 123 456 789
- Location: Fes, Morocco

---

**Last Updated:** November 16, 2024
**Default Language:** 🇩🇪 German (Deutsch)
**Version:** 1.0
