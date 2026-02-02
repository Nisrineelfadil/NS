# TELC Exam Management Feature Documentation

## Overview

The TELC (The European Language Certificates) feature provides comprehensive exam candidate management for the Nisrine School admin panel. It enables administrators to manage TELC exam candidates, plan monthly exams, distribute results, and send bulk emails with certificates.

## Features

### 1. Candidate Management
- **Manual candidate creation** with full details (name, CIN, email, phone, exam level, city)
- **Candidate editing and deletion**
- **Move candidates between months** with history tracking
- **Filter and search** by month, level, result status, or text search
- **Payment status tracking** (pending/paid)

### 2. Monthly Planning
- **Create exam months** with customizable capacity limits
- **Emergency reserve slots** (e.g., 150 regular + 50 reserve)
- **Capacity tracking** with visual progress bars
- **Auto-overflow** to next month when capacity is reached
- **Super admin alerts** when main capacity is reached
- **Lock months** to prevent further changes
- **Unlock reserve** (super admin only) for emergency additions

### 3. Results Distribution
- **Three result categories:**
  - **Passed**: Both written (Schriftlich) and oral (Mündlich) exams passed
  - **Failed**: Both exams failed
  - **Partial Pass**: One exam passed (certificate for passed module)
- **Certificate upload** for passed and partial pass candidates
- **Bulk email sending** per category with PDF attachments
- **Email status tracking** per candidate

### 4. Email Templates
- **Customizable HTML templates** for each result category
- **Placeholder support** for dynamic content:
  - `{{candidateName}}` - Candidate's full name
  - `{{examLevel}}` - Exam level (A1, A2, B1, B2, C1, C2)
  - `{{examMonth}}` - Month and year of exam
  - `{{schriftlichResult}}` - Written exam result
  - `{{muendlichResult}}` - Oral exam result
  - `{{schoolName}}` - School name
  - `{{schoolPhone}}` - School phone number
  - `{{schoolEmail}}` - School email
- **Preview functionality** before sending
- **Reset to default** option

### 5. Settings
- **Registration toggle** (enable/disable online registration)
- **Super admin email** for capacity alerts
- **Auto-overflow toggle** for automatic month switching

## Files Created

### Models
| File | Description |
|------|-------------|
| `models/TelcCandidate.js` | Candidate schema with personal info, exam details, results, certificate storage |
| `models/TelcExamMonth.js` | Monthly planning with capacity, reserve, locking, overflow settings |
| `models/TelcEmailTemplate.js` | Email templates for 3 categories with default HTML content |

### Services
| File | Description |
|------|-------------|
| `services/emailService.js` | Nodemailer-based email service for bulk emails with PDF attachments |

### Routes
| File | Description |
|------|-------------|
| `routes/telc.js` | Complete REST API for TELC features (855 lines) |

### Frontend
| File | Description |
|------|-------------|
| `js/telc.js` | Client-side JavaScript for TELC tab functionality |
| `css/admin-dashboard.css` | TELC-specific styles (appended) |
| `admin.html` | TELC tab UI and modals (updated) |

### Translations
| File | Description |
|------|-------------|
| `js/languages.json` | TELC translations for DE, EN, FR, AR |

## API Endpoints

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/telc/settings` | Get TELC settings |
| PUT | `/api/telc/settings` | Update TELC settings |

### Exam Months
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/telc/months` | Get all months (with year filter) |
| POST | `/api/telc/months` | Create new exam month |
| GET | `/api/telc/months/:id` | Get specific month |
| PUT | `/api/telc/months/:id` | Update month |
| DELETE | `/api/telc/months/:id` | Delete month |
| POST | `/api/telc/months/:id/lock` | Lock month |
| POST | `/api/telc/months/:id/unlock-reserve` | Unlock emergency reserve (super admin) |
| GET | `/api/telc/months/:id/stats` | Get month statistics |
| POST | `/api/telc/months/:id/send-bulk-emails` | Send bulk emails for category |

### Candidates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/telc/candidates` | Get all candidates (with filters) |
| POST | `/api/telc/candidates` | Create new candidate |
| GET | `/api/telc/candidates/:id` | Get specific candidate |
| PUT | `/api/telc/candidates/:id` | Update candidate |
| DELETE | `/api/telc/candidates/:id` | Delete candidate |
| PUT | `/api/telc/candidates/:id/result` | Set candidate result |
| POST | `/api/telc/candidates/:id/certificate` | Upload certificate |
| GET | `/api/telc/candidates/:id/certificate` | Download certificate |
| POST | `/api/telc/candidates/:id/move` | Move to different month |
| POST | `/api/telc/candidates/:id/send-email` | Send individual email |

### Email Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/telc/templates` | Get all templates |
| GET | `/api/telc/templates/:category` | Get specific template |
| PUT | `/api/telc/templates/:category` | Update template |
| POST | `/api/telc/templates/:category/reset` | Reset to default |

### Statistics & Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/telc/stats` | Get overall statistics |
| GET | `/api/telc/public/registration-status` | Check if registration is open (public) |

## Installation

### 1. Install Dependencies
```bash
npm install nodemailer
```

### 2. Environment Variables
Add to your `.env` file:
```env
# SMTP Configuration for TELC emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Nisrine School <your-email@gmail.com>
```

### 3. Start Server
```bash
npm start
```

## Usage Guide

### Creating an Exam Month
1. Go to **TELC** tab in admin panel
2. Click **Monthly Planning** sub-tab
3. Click **Add Month** button
4. Fill in month, year, exam date, capacity, and reserve
5. Click **Create**

### Adding Candidates
1. Go to **Candidates** sub-tab
2. Click **Add Candidate**
3. Fill in candidate details
4. Select exam month
5. Click **Save**

### Setting Results
1. Find candidate in the table
2. Click the clipboard icon (Set Result)
3. Select result category (Passed/Failed/Partial)
4. For partial, specify which exam was passed
5. Click **Save Result**

### Uploading Certificates
1. For passed/partial candidates, click the PDF icon
2. Select the certificate PDF file
3. Click **Upload**

### Sending Bulk Emails
1. Go to **Results Distribution** sub-tab
2. Select the exam month
3. Review candidates in each category
4. Click **Send All [Category] Emails** button
5. Confirm the action

### Customizing Email Templates
1. Go to **Email Templates** sub-tab
2. Select template category (Passed/Failed/Partial)
3. Edit subject and body
4. Use placeholders for dynamic content
5. Click **Preview** to test
6. Click **Save Template**

## Database Schema

### TelcCandidate
```javascript
{
  fullName: String,
  cin: String,
  email: String,
  phoneNumber: String,
  city: String,
  examLevel: String (A1-C2),
  examMonth: ObjectId (ref: TelcExamMonth),
  registrationStatus: String,
  registrationDate: Date,
  resultCategory: String (passed/failed/partial),
  schriftlichResult: String,
  muendlichResult: String,
  resultDate: Date,
  resultNotes: String,
  certificate: { data: String, filename: String, uploadDate: Date },
  emailSent: Boolean,
  emailSentDate: Date,
  movementHistory: [{ from, to, date, reason, movedBy }],
  paymentStatus: String,
  notes: String
}
```

### TelcExamMonth
```javascript
{
  month: Number (1-12),
  year: Number,
  examDate: Date,
  maxCapacity: Number,
  emergencyReserve: Number,
  isOpen: Boolean,
  isLocked: Boolean,
  reserveUnlocked: Boolean,
  reserveUnlockedBy: ObjectId,
  reserveUnlockedAt: Date,
  autoOverflow: Boolean,
  overflowToMonth: ObjectId,
  resultsDistributed: Boolean,
  stats: { total, passed, failed, partial, emailsSent },
  notes: String
}
```

### TelcEmailTemplate
```javascript
{
  category: String (passed/failed/partial),
  subject: String,
  body: String (HTML),
  isDefault: Boolean,
  lastModified: Date,
  modifiedBy: ObjectId
}
```

## Multi-Language Support

The TELC feature supports 4 languages:
- **German (DE)** - Primary
- **English (EN)**
- **French (FR)**
- **Arabic (AR)** - RTL supported

All UI elements use `data-i18n` attributes for automatic translation.

## Security

- All routes require JWT authentication
- Super admin role required for:
  - Unlocking emergency reserve
  - Bulk email sending
- Certificate files stored as base64 in MongoDB
- Email credentials stored in environment variables

## Troubleshooting

### Emails not sending
1. Check SMTP credentials in `.env`
2. For Gmail, use App Password (not regular password)
3. Check server logs for nodemailer errors

### Capacity alerts not working
1. Verify `telcSuperAdminEmail` is set in settings
2. Check SMTP configuration

### Certificate upload failing
1. Ensure file is PDF format
2. Check file size (max 5MB)
3. Verify MongoDB connection

## Future Enhancements

- [ ] Online candidate registration form
- [ ] Drag-and-drop candidate movement
- [ ] PDF export of candidate lists
- [ ] SMS notifications
- [ ] Integration with TELC official systems
- [ ] Automated result import

---

**Version:** 1.0.0  
**Created:** December 2024  
**Author:** Cascade AI Assistant
