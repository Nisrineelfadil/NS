# Rendez-vous (Appointments) Management System

## Overview
A comprehensive appointment management system that allows admins to track and manage client meetings efficiently. The system includes manual entry, filtering, status tracking, and PDF export capabilities.

## Features Implemented

### 1. **Appointment Entry**
- Manual entry of client appointment requests
- Required fields:
  - Full Name
  - Phone Number
  - Purpose/Notes
  - Appointment Date
- Optional fields:
  - Priority (Low, Medium, High)
  - Additional Notes

### 2. **Appointment Management**
- View all appointments in a sortable table
- Filter appointments by:
  - Date (specific day)
  - Status (Pending, Completed, Cancelled)
  - Priority (Low, Medium, High)
  - Search (Name, Phone, Purpose)
- Real-time statistics:
  - Today's appointments
  - Pending appointments
  - Completed appointments
  - Total appointments

### 3. **Status Tracking**
- Three status types:
  - **Pending**: New appointments awaiting completion
  - **Completed**: Meetings that have been handled
  - **Cancelled**: Appointments that were cancelled
- Quick status update with one-click "Mark as Completed" button
- Tracks who completed the appointment and when

### 4. **Priority System**
- Three priority levels with color coding:
  - **High**: Red badge with exclamation icon
  - **Medium**: Blue badge (default)
  - **Low**: Gray badge
- Visual priority indicators in the table

### 5. **PDF Export**
- Generate daily appointment lists as PDF
- PDF Features:
  - School logo and branding
  - Date header with formatted date
  - Professional table layout with:
    - Client Name
    - Phone Number
    - Purpose/Notes
  - Priority color coding (high priority = light red background)
  - Optimized file size (target: 1-1.2 MB max)
  - Automatic filename: `Appointments_YYYY-MM-DD.pdf`

### 6. **User Interface**
- Integrated into main admin dashboard
- New "Rendez-vous" menu item with "NEW" badge
- Clean, modern interface with:
  - Statistics cards at the top
  - Filter controls
  - Sortable data table
  - Action buttons (Edit, Delete, Complete)
- Modal dialog for adding/editing appointments

## Technical Implementation

### Backend Components

#### 1. **Database Model** (`models/Appointment.js`)
```javascript
{
  fullName: String (required, indexed),
  phoneNumber: String (required, indexed),
  purpose: String (required),
  appointmentDate: Date (required, indexed),
  status: String (enum: pending/completed/cancelled),
  priority: String (enum: low/medium/high),
  createdBy: ObjectId (Admin reference),
  createdByName: String,
  completedAt: Date,
  completedBy: ObjectId (Admin reference),
  completedByName: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `appointmentDate + status` (for efficient filtering)
- `phoneNumber + appointmentDate` (for client lookup)
- Full-text search on `fullName` and `purpose`

#### 2. **API Routes** (`routes/appointments.js`)

**Endpoints:**
- `GET /api/appointments` - Get all appointments with filters
  - Query params: `date`, `status`, `priority`, `search`
- `GET /api/appointments/stats` - Get appointment statistics
- `GET /api/appointments/:id` - Get specific appointment
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `PATCH /api/appointments/:id/status` - Update status only
- `DELETE /api/appointments/:id` - Delete appointment
- `GET /api/appointments/pdf/daily?date=YYYY-MM-DD` - Generate daily PDF

**Authentication:** All routes require admin authentication via JWT token.

#### 3. **PDF Generator** (`services/appointmentPdfGenerator.js`)
- Uses PDFKit library (already installed)
- Generates professional appointment lists
- Features:
  - School logo integration
  - Color-coded priority system
  - Automatic pagination for long lists
  - Compressed output for small file size
  - Professional formatting with headers and footers

### Frontend Components

#### 1. **HTML Structure** (`admin.html`)
- New menu item in sidebar
- New tab content with:
  - Statistics grid (4 cards)
  - Filter controls (date, status, priority, search)
  - Data table
  - Action buttons
- Modal dialog for add/edit operations

#### 2. **JavaScript** (`js/appointments.js`)
- Appointment loading with filters
- Statistics updates
- CRUD operations (Create, Read, Update, Delete)
- Status management
- PDF download functionality
- Real-time search with debouncing
- Form validation

#### 3. **CSS Styles** (`css/admin-dashboard.css`)
- Badge styles for status and priority
- Responsive table layout
- Modal styling (reuses existing styles)
- Button styles (reuses existing styles)

## File Structure

```
Nis/
├── models/
│   └── Appointment.js                    # Database schema
├── routes/
│   └── appointments.js                   # API endpoints
├── services/
│   └── appointmentPdfGenerator.js        # PDF generation
├── js/
│   └── appointments.js                   # Frontend logic
├── admin.html                            # Updated with appointments tab
├── server.js                             # Updated with appointments route
└── RENDEZ_VOUS_FEATURE.md               # This documentation
```

## Usage Guide

### For Admins

#### Adding a New Appointment
1. Navigate to "Rendez-vous" in the sidebar
2. Click "New Appointment" button
3. Fill in the form:
   - Client's full name
   - Phone number
   - Purpose of meeting
   - Select appointment date
   - Set priority (optional)
   - Add additional notes (optional)
4. Click "Save Appointment"

#### Viewing Appointments
1. Go to "Rendez-vous" tab
2. Use filters to narrow down results:
   - Select a specific date
   - Filter by status
   - Filter by priority
   - Search by name, phone, or purpose
3. View statistics at the top for quick overview

#### Managing Appointments
- **Mark as Completed**: Click the green checkmark button
- **Edit**: Click the blue edit button
- **Delete**: Click the red trash button (requires confirmation)

#### Downloading Daily PDF
1. Select the desired date using the date filter
2. Click "Download Daily PDF" button
3. PDF will be automatically downloaded with filename `Appointments_YYYY-MM-DD.pdf`
4. Print or share the PDF as needed

### User Flow Example

**Scenario:** Client calls to request a meeting

1. **Admin receives call**
   - Client: "I'd like to schedule a meeting to discuss enrollment"
   
2. **Admin opens Rendez-vous tab**
   - Clicks "New Appointment"
   
3. **Admin enters information**
   - Name: "Ahmed Benali"
   - Phone: "+212 6XX XXX XXX"
   - Purpose: "Discuss enrollment for German language course"
   - Date: Tomorrow's date
   - Priority: Medium
   
4. **Admin saves appointment**
   - Appointment is stored in system
   - Appears in the appointments list
   
5. **Next day**
   - Admin filters by today's date
   - Downloads daily PDF
   - Prints the list for reference
   
6. **After meeting**
   - Admin marks appointment as "Completed"
   - System records completion time and admin name

## API Examples

### Create Appointment
```javascript
POST /api/appointments
Headers: {
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
Body: {
  "fullName": "Ahmed Benali",
  "phoneNumber": "+212 6XX XXX XXX",
  "purpose": "Discuss enrollment",
  "appointmentDate": "2024-11-14",
  "priority": "medium",
  "notes": "Interested in B1 level"
}
```

### Get Appointments for Today
```javascript
GET /api/appointments?date=2024-11-14
Headers: {
  "Authorization": "Bearer <token>"
}
```

### Download Daily PDF
```javascript
GET /api/appointments/pdf/daily?date=2024-11-14
Headers: {
  "Authorization": "Bearer <token>"
}
Response: PDF file download
```

## Security

- All API endpoints require admin authentication
- JWT token validation on every request
- Input validation and sanitization
- SQL injection prevention (MongoDB)
- XSS protection (escaped output)

## Performance Optimizations

- Database indexes for fast queries
- Debounced search input (300ms delay)
- Efficient date range queries
- PDF compression for smaller file sizes
- Lazy loading of appointments (only when tab is active)

## Future Enhancements (Optional)

1. **SMS/Email Reminders**
   - Send automatic reminders to clients
   - Notify staff of upcoming appointments

2. **Calendar View**
   - Visual calendar interface
   - Drag-and-drop rescheduling

3. **Recurring Appointments**
   - Support for weekly/monthly recurring meetings

4. **Client Portal**
   - Allow clients to book appointments online
   - Self-service scheduling

5. **Analytics Dashboard**
   - Appointment trends over time
   - Most common meeting purposes
   - Peak appointment times

## Troubleshooting

### Appointments Not Loading
- Check browser console for errors
- Verify admin token is valid
- Ensure server is running
- Check database connection

### PDF Not Generating
- Verify date filter is set
- Check server logs for errors
- Ensure PDFKit is installed
- Verify logo file exists at `Img/logo.png`

### Filters Not Working
- Clear browser cache
- Check JavaScript console for errors
- Verify API endpoints are responding

## Dependencies

**Existing (Already Installed):**
- `pdfkit` - PDF generation
- `mongoose` - MongoDB ODM
- `express` - Web framework
- `jsonwebtoken` - Authentication

**No New Dependencies Required** - This feature uses only existing packages.

## Maintenance

### Database Cleanup
Consider implementing periodic cleanup of old completed appointments:
```javascript
// Example: Delete completed appointments older than 1 year
db.appointments.deleteMany({
  status: 'completed',
  completedAt: { $lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
});
```

### Backup Recommendations
- Regular MongoDB backups
- Export important appointments to CSV/Excel
- Archive old PDFs for record-keeping

## Support

For issues or questions:
1. Check this documentation
2. Review server logs
3. Check browser console
4. Contact system administrator

---

**Version:** 1.0  
**Last Updated:** November 13, 2024  
**Author:** Cascade AI Assistant  
**Status:** ✅ Production Ready
