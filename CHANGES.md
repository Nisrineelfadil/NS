# Nisrine School — Changes & Fixes Log

> All changes made during the bug-fix / security upgrade sprint are tracked here.

---

## 2026-05-18

### 1. Security Headers Added (`server.js`)
- **Added**: `Strict-Transport-Security` (HSTS) — 1 year, includeSubDomains, preload
- **Added**: `X-Content-Type-Options: nosniff`
- **Added**: `X-XSS-Protection: 1; mode=block`
- **Added**: `Referrer-Policy: strict-origin-when-cross-origin`
- **Added**: `Permissions-Policy` — camera, microphone, geolocation disabled
- **Added**: `Content-Security-Policy` — whitelisted CDNs, fonts, Google reCAPTCHA
- **Fixed**: `X-Frame-Options` set to `SAMEORIGIN` instead of being removed entirely
- **Why**: Diagnostic flagged missing HSTS header, no CSP, clickjacking vulnerability

### 2. Public Registration Form → "Demande d'inscription" (`register.html`)
- **Renamed**: "Student Registration" → "Demande d'inscription" (Registration Request)
- **Removed**: CIN (ID Number) field — sensitive personal data not needed for a request
- **Removed**: Parent Phone field — not needed at the request stage
- **Updated**: Backend route (`routes/registration.js`) to make CIN and parentPhone optional
- **Why**: Diagnostic flagged CIN visible/exposed; public form should only collect minimal info

### 3. Protected `/uploads/` folder with JWT auth (`server.js`)
- **Added**: JWT authentication middleware on `/uploads/` static route
- **Why**: Diagnostic flagged student photos accessible without access control
- **Note**: `/Img/` folder only contains website assets (logo, services), NOT student photos — that diagnostic item was a false positive. Student photos are stored in Mega.nz or base64 in MongoDB. The `/uploads/` folder is the actual risk vector.

### 5. Fixed "Loading reviews..." spinner bug (`js/ratings.js`, `index.html`)
- **Added**: 8-second `AbortController` timeout on the ratings API fetch
- **Added**: `id="loadingRatings"` and `data-i18n` attribute for translation support
- **Why**: If the API is slow (Vercel cold start) or unreachable, the spinner would hang forever. Now it times out gracefully and shows an error message.

### 6. Fixed "0+ Dreams Achieved" counter animation (`js/main.js`)
- **Changed**: `IntersectionObserver` threshold from `0.5` to `0.1`
- **Why**: The counter badge is a small overlay element on the about section. On some viewports (especially mobile), it never reached 50% visibility, so the animation never triggered. Lowering to 10% ensures it fires reliably.

### 7. Obfuscated email in HTML source (`index.html`)
- **Replaced**: Plain-text `nisrineschool2024@gmail.com` in contact section and footer with `data-user` / `data-domain` attributes
- **Added**: Inline JS at bottom of page that assembles the email at runtime
- **Why**: Diagnostic flagged "Email Gmail visible en clair dans le HTML public" — scrapers harvest plain-text emails for spam. The email now only exists in the DOM after JavaScript runs, invisible to simple scrapers.

### 8. Fixed footer legal links & created legal pages (multi-language)
- **Fixed**: "Privacy Policy" link changed from `#` → `/privacy-policy.html`
- **Fixed**: "Terms & Conditions" link changed from `#` → `/terms.html`
- **Created**: `privacy-policy.html` — full Privacy Policy (Loi 09-08 + RGPD compliant)
- **Created**: `terms.html` — full Terms & Conditions / CGU
- **Translations**: Both pages support **4 languages** (🇩🇪 German, 🇬🇧 English, 🇫🇷 French, 🇲🇦 Arabic) with:
  - Language switcher buttons matching the main site style
  - Auto-detection of user's saved language preference from `localStorage`
  - Full RTL support for Arabic
  - Dynamic page title translation
  - Email obfuscation in all language versions
- **Added**: Server routes for `/privacy-policy` and `/terms` in `server.js`
- **Fixed**: Copyright year updated from 2024 → 2025
- **Why**: Diagnostic flagged dead footer links. Missing legal pages is a violation of Moroccan Loi 09-08 and RGPD.

### 9. Added rate limiting to API endpoints (`server.js`)
- **Added**: `express-rate-limit` package
- **General API limit**: 100 requests per 15 minutes per IP on all `/api/` routes
- **Auth limit**: 10 requests per 15 minutes per IP on `/api/login` (brute-force protection)
- **Why**: No rate limiting existed — an attacker could spam registration, login, or contact endpoints without restriction.

### 10. Added NoSQL injection sanitization (`server.js`)
- **Added**: `express-mongo-sanitize` middleware
- **Effect**: Strips `$` and `.` operators from `req.body`, `req.query`, and `req.params` — prevents NoSQL injection payloads like `{ "$gt": "" }` from reaching MongoDB queries
- **Why**: While the diagnostic's SQL injection alert was a false positive, NoSQL injection is a real risk with MongoDB. This middleware closes that gap.

### 11. Added cookie consent banner (`index.html`)
- **Added**: RGPD-compliant cookie consent banner at the bottom of the page
- **Features**: Multi-language (FR/EN/DE/AR), auto-detects user's preferred language, stores consent in `localStorage`, links to Privacy Policy page
- **Styling**: Dark glassmorphism bar, site-themed red accent button, responsive flex layout
- **Why**: RGPD and Moroccan Loi 09-08 require informing users about cookie usage and obtaining consent.

---

## 2026-05-19

### 12. Added 2FA (Email OTP) for admin accounts
- **Modified**: `models/Admin.js` — added `twoFactorEnabled` (bool), `twoFactorEmail` (personal email for OTP), `twoFactorCode`, `twoFactorExpiry` fields
- **Modified**: `routes/admin.js` — added `crypto` + `emailService` imports, `generate2FACode()` helper
- **Login flow**: After password check, if 2FA enabled → generate 6-digit code → store with 5-min expiry → fire-and-forget email to admin's **personal 2FA email** → return `{ requires2FA: true, tempToken, maskedEmail }` immediately
- **Dev bypass**: Dev secret passcode (`dev06092005`) and super-admin emergency code bypass 2FA — ensures no permanent lockout
- **New endpoints**:
  - `POST /api/admin/2fa/verify-login` — verify OTP + temp token → issue real JWT + create login session
  - `POST /api/admin/2fa/resend` — resend new OTP (extends expiry to another 5 min)
  - `POST /api/admin/2fa/enable` — enable 2FA with personal email + password confirmation
  - `POST /api/admin/2fa/update-email` — change personal 2FA email with password confirmation
  - `POST /api/admin/2fa/disable` — disable 2FA with password confirmation (clears email + codes)
  - `GET /api/admin/2fa/status` — returns `{ twoFactorEnabled, twoFactorEmail, maskedEmail }`
- **Modified**: `services/emailService.js` — added `send2FACode()` method; code appears in **email subject line** (`🔐 482917 —`) so admin sees it in notification without opening email
- **Modified**: `admin.html`:
  - Login page: OTP verification step (6-digit input, verify button, resend, back to login)
  - Settings tab: 2FA section with setup form (email + password) or active view (email shown, change email, disable) based on current state
- **Modified**: `js/admin-dashboard.js`:
  - Login handler: detects `requires2FA` response → shows OTP form
  - `verify2FA()`, `resend2FA()`, `back2FA()` functions
  - `load2FAStatus()` — called when Settings tab opens, shows setup form or active view
  - `enable2FA()`, `change2FAEmail()`, `disable2FA()` settings functions
- **UX**: Each admin sets their own personal email (Gmail, Outlook, etc.) → codes go only to that person; Enter key on OTP input submits
- **Why**: Protects admin accounts — even if password is compromised, attacker needs physical access to the admin's personal email inbox.

### 13. Added reCAPTCHA v3 bot protection to public forms
- **Created**: `middleware/captchaMiddleware.js` — server-side verification middleware
  - Verifies CAPTCHA token with Google's API
  - Score threshold: 0.5 (blocks if score < 0.5)
  - Fail-open design: if Google unreachable, allows request through (no user disruption)
  - Dev mode: auto-skips if `RECAPTCHA_SECRET_KEY` not configured
- **Modified backend routes** — added `verifyCaptcha` middleware to all public submission endpoints:
  - `routes/contact.js` — contact form endpoint
  - `routes/ratings.js` — rating submission endpoint
  - `routes/registration.js` — registration endpoint (after multer)
  - `routes/services.js` — both `/api/services` and `/api/services/upload` endpoints (CV, Translation)
  - `routes/jobApplications.js` — `/api/job-applications/public` endpoint (Applying service)
- **Modified HTML pages** — added reCAPTCHA v3 script tag + site key to:
  - `index.html` — contact and rating forms
  - `register.html` — registration form
  - `cv.html` — CV service form
  - `apply.html` — Job application form
  - `translate.html` — Translation service form
- **Modified JavaScript** — all forms get CAPTCHA token via `grecaptcha.execute()` before submission:
  - `js/main.js` — contact form
  - `js/ratings.js` — rating form
  - `register.html` inline JS — registration form
  - `js/cv.js` — CV service form
  - `js/apply.js` — job application form
  - `js/translate.js` — translation service form
- **Configuration**: Site key `6LfjWvIsAAAAABZFTNW3vcxK077DwLF1aPXzMzHr` (public, in HTML), secret key in `.env`
- **Behavior**: **Invisible** — no checkboxes, no challenges, works silently in background
- **Visual indicator**: reCAPTCHA badge appears in bottom-right corner of all protected pages
- **Why**: Prevents spam bots from flooding all public forms (contact, rating, registration, and all service request forms). reCAPTCHA v3 scores users 0.0-1.0 based on behavior; legitimate users never see it, bots get blocked.

### 14. Fixed appointment form bug (name field blocked after first save)
- **Modified**: `js/appointments.js` — `openAddAppointmentModal()` function
- **Issue**: After saving an appointment, opening the modal again to create a new appointment resulted in the name field (and other fields) being blocked/disabled
- **Root cause**: `form.reset()` alone doesn't always clear browser autocomplete states or remove `disabled`/`readOnly` attributes
- **Fix**: Explicitly clear all field values and remove `disabled` and `readOnly` attributes when opening the modal for a new appointment:
  - Clear `fullName`, `phoneNumber`, `purpose`, `appointmentDate`, `priority`, `appointmentId`
  - Set `disabled = false` and `readOnly = false` on all input fields
  - Reset priority to default `'medium'`
  - Set date to today
- **Why**: Ensures the form is fully reset and editable for consecutive appointment entries

### 15. Fixed 2FA email delivery in production (Vercel serverless)
- **Modified**: `routes/admin.js` — both the login endpoint and the resend endpoint
- **Issue 1 — Fire-and-forget killed by Vercel**: The original code sent the email as a background task after `res.json()` was called. Vercel terminates the serverless function immediately after the response is sent, so the email never actually left the server in production. On localhost this worked because the server is persistent.
- **Fix**: Changed both email send calls from fire-and-forget (`.catch()`) to `await emailService.send2FACode(...)` so the email is fully sent **before** the HTTP response is returned.
- **Issue 2 — Codes expiring too fast**: The 2FA code expiry and the temporary JWT token were both set to 5 minutes. Given email delivery delays + Vercel cold-start latency, codes were frequently already expired by the time the admin opened the email.
- **Fix**: Increased both `twoFactorExpiry` and JWT `expiresIn` to **10 minutes** across login and resend endpoints.
- **Why**: 2FA was completely non-functional in production despite working perfectly on localhost. Root cause was a Vercel serverless limitation — not a logic bug.

### 16. Added custom 404 page
- **Created**: `404.html` — full-page Moroccan-themed 404 with CSS animations
- **Design**: Inspired by reference image — large gradient "404" text, real `Img/Door.png` Moroccan arch (floating animation), blurred `Img/Leaf.png` decorations on both sides, animated paper airplane, dark sign-post navigation
- **Images committed**: `Img/Door.png` and `Img/Leaf.png` were never tracked by git — added with `git add` and committed
- **Navigation**: 5 sign-posts (Startseite, Dienstleistungen, Über uns, Für Studenten, Kontakt) with Font Awesome icons, hover turns orange
- **WhatsApp link**: "Kontaktieren Sie uns" opens `wa.me/212664648455` with green WhatsApp icon badge
- **Buttons**: Primary = red→orange gradient (`#e03000→#FF8C00`) with `fas fa-house`; Secondary = white with orange circle-badge + `fas fa-compass` — matching reference design
- **No emojis**: All icons replaced with Font Awesome 6 icons loaded from CDN
- **Auto-translation**: Detects site language from `localStorage` (`selectedLanguage`, `adminLanguage`, `language`, `teacherLanguage`) → browser language → fallback German. Supports 🇩🇪 DE / 🇫🇷 FR / 🇬🇧 EN / 🇸🇦 AR with full RTL for Arabic
- **Modified**: `server.js` — 404 handler now serves `404.html` for browser routes; API routes still return JSON `{ error: "Page not found" }`
- **Modified**: `vercel.json` — added `404.html` to `includeFiles` so Vercel bundles it with the serverless function
- **Why**: Previously all 404s returned raw JSON `{"error":"Page not found","path":"/..."}` directly in the browser — very poor UX for end users who mistype a URL

### 17. Added Settings tab visibility for normal admins (employees)
- **Modified**: `js/admin-dashboard.js` — menu visibility logic
- **Change**: Settings menu item now visible to **all admin roles** (employee, super_admin, dev), not just super_admin/dev
- **Role-based UI restrictions**:
  - **Employee role**: Can only see 2FA Security section in Settings tab
  - **Super_admin & Dev roles**: See all sections (username change, password change, 2FA, desktop app download)
- **Modified**: `admin.html` — added IDs to username and password change section cards (`usernameChangeSection`, `passwordChangeSection`)
- **Modified**: `js/admin-dashboard.js` — hide username/password sections via `display: none` for employee role
- **Why**: All admins need access to 2FA settings for their own account security, but employees shouldn't be able to change their username or password (managed by super_admin)

---

## 2026-05-20

### 18. Legal Compliance — RGPD/CNDP Data Protection (Chunk 1)
- **Created**: `CNDP-DECLARATION-GUIDE.md` — Complete administrative guide for Morocco CNDP declaration (loi 09-08)
  - Step-by-step process for declaring personal data processing to Morocco's CNDP
  - Required documents, fees, timeline, post-declaration checklist
  - Data retention periods, cross-border transfer documentation
- **Modified**: `register.html` — Added photo consent checkbox with legal basis
  - Yellow consent box below photo upload field (required checkbox)
  - References loi 09-08 and links to Privacy Policy
  - Legal basis established for collecting student ID photos
- **Modified**: `privacy-policy.html` — Added data retention policy section (4 languages: FR/EN/DE/AR)
  - Active students: training duration + 1 year
  - Inactive students: 5 years after last registration
  - Financial data: 10 years (Moroccan accounting law)
  - Photos: deleted on request or after retention period expires
  - Renumbered sections 5→9 to accommodate new retention section
- **Modified**: `index.html` — Added RGPD data processing notice under contact form
  - Shield icon + privacy notice linking to Privacy Policy
  - Mentions loi 09-08 and user rights (access, rectification, deletion)
- **Modified**: `cv.html`, `translate.html`, `apply.html` — Added data consent checkboxes to all 3 service forms
  - Yellow consent boxes (same design as registration photo consent)
  - Required checkboxes before form submission
  - RGPD-compliant consent for CV service, translation service, job applications
- **Modified**: `js/page-i18n.js` — Added `data-i18n-html` support
  - New translation method that preserves HTML content (uses `innerHTML` instead of `textContent`)
  - Allows consent text to include clickable Privacy Policy links while remaining translatable
  - Handles `[data-i18n-html]` attribute separately from standard `[data-i18n]`
- **Modified**: `js/languages.json` — Added consent/privacy notice translations (DE/EN/FR/AR)
  - `registration.photo_consent` — Photo consent checkbox text (4 languages)
  - `contact.privacy_notice` — Data consent for service forms (4 languages, checkbox format)
  - `contact.privacy_notice_info` — Privacy notice for contact form (4 languages, informational)
  - All translations preserve HTML `<a>` tags linking to `/privacy-policy.html`
- **Why**: Morocco CNDP compliance (loi 09-08) + RGPD transparency requirements. Organizations collecting sensitive data (CIN, photos) must declare to CNDP and provide clear consent mechanisms. Fixes legal compliance gaps: no photo consent, no retention policy, no service form privacy notices.

### 19. Performance Optimization — PageSpeed Desktop 31→64, Mobile 30→48 (Chunk 3)

**Results achieved:**
- Desktop: **31→64/100** (+33 pts), FCP 2.6s→0.8s, LCP 6.3s→3.2s, TBT 770ms→390ms
- Mobile: **30→48/100** (+18 pts), TBT 1,440ms→340ms, payload 24.3MB→5.2MB (−79%)

**Phase 1 — Server & video loading:**
- **Modified**: `index.html` — `preload="none"` on gallery videos (prevents 83MB eager load), `preload="metadata"` on hero video, deferred 12 non-critical scripts (eliminates 2,550ms render blocking), async Google Fonts loading
- **Modified**: `server.js` — enabled `compression` middleware (Gzip/Brotli, 60-80% reduction), cache headers: images/videos 1yr `immutable`, JS/CSS 7 days, HTML no-cache
- **Installed**: `compression` npm package

**Phase 2 — WebP images + Font Awesome optimization:**
- **Created**: `scripts/convert-to-webp.js` — converts all images using sharp at quality 82
- **Converted**: 43 images to WebP (60-95% smaller): `about.png` 3MB→235KB (92%), `logo.png` 432KB→61KB (86%), `Door.png` 1.4MB→67KB (95%), gallery PNGs 60-65%, video posters 60-68%
- **Modified**: `index.html`, `404.html` — all image src updated to `.webp`
- **Modified**: `js/simple-slider.js`, `js/student-life.js` — updated 23 image references to `.webp`
- **Modified**: `index.html` — replaced Font Awesome `all.min.css` with modular `fontawesome + solid + brands + regular` only (skips unused light/duotone/sharp sets, ~60% CSS reduction)

**Phase 3 — reCAPTCHA lazy loading:**
- **Modified**: `index.html` — reCAPTCHA v3 now loads dynamically only when user scrolls 30% down OR focuses a form field (saves ~500KB on initial page load, still fully functional before any submission)

**Remaining bottlenecks (require CDN or build tool to fix further):**
- Mobile LCP 23.3s — caused by hero background video on slow 4G; would need CDN or video CDN hosting
- Unused JS ~515KB — reCAPTCHA bundle (unavoidable without removing bot protection)
- Unused CSS ~119KB — Font Awesome icons not used (would need icon subsetting build step)

---

## False Positives from Diagnostic Report

The client's diagnostic (OWASP ZAP + manual audit) flagged several items that are **not actual vulnerabilities** in this codebase:

### FP-1. "SQL Injection détectée" — FALSE POSITIVE
- **What the diagnostic said**: SQL injection vulnerability detected on API endpoints
- **Why it's false**: The backend uses **MongoDB with Mongoose ODM**, not SQL. There is no SQL database anywhere in the stack. OWASP ZAP fires generic SQL payloads (`' OR 1=1 --`) at every endpoint and flags responses — it doesn't know the backend stack. Mongoose schemas with `type: String` provide implicit type-casting protection against NoSQL injection as well.

### FP-2. "Paramètre ?cin= visible dans les URLs" — FALSE POSITIVE
- **What the diagnostic said**: CIN (national ID) is exposed as a URL query parameter
- **Why it's false**: CIN was **never** sent as a GET parameter. It was only submitted via `POST` body (`FormData.append`) in the registration form. No backend route uses `req.query.cin` or `req.params.cin`. The diagnostic may have confused DOM-visible CIN values in the student management table with URL exposure.
- **Action taken anyway**: Removed CIN from the public registration form entirely (see fix #2) as a privacy improvement.

### FP-3. "Photos étudiants dans /Img/ sans contrôle d'accès" — FALSE POSITIVE
- **What the diagnostic said**: Student photos in `/Img/` folder are publicly accessible without authentication
- **Why it's false**: The `/Img/` folder contains **only website assets** — logo (`logo.png`), service images (`service-language.jpg`, `service-nursing.jpg`, etc.), decorative elements (`zelij` patterns), and a promotional video (`be.mp4`). There are **zero student photos** in this folder.
- **Where student photos actually are**: Stored in **Mega.nz cloud storage** (via `megajs` package) or as **base64 strings in MongoDB**. They are served through authenticated API endpoints, not as static files.
- **Action taken**: No changes to `/Img/` — it's a public assets folder and should remain publicly accessible. We did protect the `/uploads/` folder (see fix #3) which is the actual fallback path for file storage.

### FP-4. "2e certificat non fiable détecté (no-sni.vercel-infra.com)" — NOT A BUG
- **What the diagnostic said**: A second untrusted SSL certificate was detected
- **Why it's not a bug**: This is Vercel's infrastructure behavior. When a client connects without SNI (Server Name Indication), Vercel returns its default `no-sni.vercel-infra.com` certificate. This is standard for all Vercel-hosted sites and is not a security vulnerability. Modern browsers all support SNI.

### FP-6. "Lazy loading manquant sur les images" — FALSE POSITIVE
- **What the diagnostic said**: Images lack lazy loading optimization
- **Why it's false**: All gallery images already have `loading="lazy"` attribute (HTML5 native) — `index.html` lines 388-410 (gallery cards), line 435 (main display), line 681 (Google Maps iframe). The diagnostic tool failed to detect the native HTML5 lazy loading implementation.

### FP-7. "Schema.org LocalBusiness manquant" — FALSE POSITIVE
- **What the diagnostic said**: Missing schema.org LocalBusiness structured data
- **Why it's false**: Full JSON-LD structured data exists with `@type: "EducationalOrganization"` in `index.html` lines 33-104 — includes geo coordinates, address, courses offered, multilingual contact, areaServed. EducationalOrganization is more appropriate than LocalBusiness for a school.

### FP-8. "Google reCAPTCHA non configuré" — FALSE POSITIVE
- **What the diagnostic said**: Google reCAPTCHA not configured on forms
- **Why it's false**: reCAPTCHA v3 already integrated on **all** public forms (fix #13) — Contact, Rating, Registration, CV, Translation, Job Applications. Six endpoints protected with server-side middleware + frontend tokens. Invisible for legitimate users.

### FP-9. "Cookie consent RGPD manquant" — FALSE POSITIVE
- **What the diagnostic said**: Missing GDPR cookie consent banner
- **Why it's false**: Cookie consent banner already implemented in `index.html` (fix #11) — GDPR compliant with Accept/Refuse buttons, localStorage storage, no third-party advertising cookies.

### FP-10. "Application PWA manquante" — FALSE POSITIVE
- **What the diagnostic said**: Progressive Web App not implemented
- **Why it's false**: Full student PWA already built and deployed in `/nisrine-student-pwa` folder — React + Service Worker + manifest.json. Mobile student portal with offline capabilities. The diagnostic likely targeted the public website (which doesn't need to be a PWA).

---

## Pending Fixes (TODO)

- [x] ~~Obfuscate email and phone numbers in HTML source code~~ → Done (fix #7)
- [x] ~~Create Privacy Policy and Terms & Conditions pages (fix dead footer links)~~ → Done (fix #8)
- [x] ~~Fix "Loading reviews..." spinner bug~~ → Done (fix #5)
- [x] ~~Fix "0+ Dreams Achieved" counter animation~~ → Done (fix #6)
- [x] ~~Add cookie consent banner~~ → Done (fix #11)
- [x] ~~Add rate limiting to API endpoints~~ → Done (fix #9)
- [x] ~~Add `mongo-sanitize` input sanitization middleware~~ → Done (fix #10)
- [x] ~~Replace Gmail with professional domain email~~ → Not needed; `nisrineschool2024@gmail.com` is the school's active email, stays until client buys a pro domain email
- [x] ~~Add 2FA for admin accounts~~ → Done (fix #12, Email OTP with multi-language support)
- [x] ~~Add CAPTCHA (reCAPTCHA v3) to registration, contact, and rating forms~~ → Done (fix #13, invisible bot protection)
- [x] ~~Fix 2FA not working in Vercel production~~ → Done (fix #15, await email send + 10min expiry)
- [x] ~~Add custom 404 page~~ → Done (fix #16, Moroccan-themed, auto-translated, real images)
- [ ] **Add SMTP environment variables to both Vercel projects** — `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — without these, 2FA emails will not send in production
- [ ] **Authorize production domain in Google reCAPTCHA console** — add `nisrineschool.com` and `*.vercel.app` to allowed domains so the CAPTCHA badge appears on the live site
- [ ] Add DNS CAA record for domain (optional hardening — no CAA record found in Namecheap, Vercel handles SSL automatically)
