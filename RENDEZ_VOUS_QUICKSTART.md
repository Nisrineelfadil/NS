# Rendez-vous System - Quick Start Guide

## 🚀 Getting Started (30 seconds)

### 1. Start Your Server
```bash
node server.js
```

### 2. Login to Admin Dashboard
- Go to: `http://localhost:3000/admin`
- Login with your admin credentials

### 3. Access Rendez-vous
- Click **"Rendez-vous"** in the sidebar (has a "NEW" badge)
- You're ready to manage appointments!

## 📞 Common Tasks

### Adding an Appointment (When Client Calls)

1. Click **"New Appointment"** button
2. Fill in the form:
   - **Full Name**: Client's name
   - **Phone Number**: Client's phone
   - **Purpose**: Why they're calling (e.g., "Discuss enrollment")
   - **Date**: When they want to meet
   - **Priority**: High/Medium/Low (optional)
3. Click **"Save Appointment"**

**Done!** The appointment is now in the system.

### Viewing Today's Appointments

1. The date filter defaults to today
2. All today's appointments are shown automatically
3. Check the statistics at the top for a quick overview

### Downloading Daily PDF

1. Select the date you want (defaults to today)
2. Click **"Download Daily PDF"** button
3. PDF downloads automatically
4. Print it for physical reference

### Marking Appointment as Completed

1. Find the appointment in the table
2. Click the green **checkmark** button
3. Status changes to "Completed"

**That's it!**

## 🎯 Typical Daily Workflow

### Morning
```
1. Login to admin dashboard
2. Go to Rendez-vous tab
3. Check today's appointments (already filtered)
4. Download and print today's PDF
5. Keep the printed list at reception desk
```

### During the Day
```
When client calls:
1. Click "New Appointment"
2. Enter: Name, Phone, Purpose, Date
3. Save
4. Inform client of scheduled time
```

### After Meetings
```
1. Find the appointment in the list
2. Click green checkmark to mark as completed
3. System records who completed it and when
```

### End of Day
```
1. Review completed appointments
2. Check pending appointments for tomorrow
3. Download tomorrow's PDF (change date filter)
```

## 🔍 Filtering & Search

### By Date
- Use the date picker to see appointments for any day
- Defaults to today

### By Status
- **All Status**: See everything
- **Pending**: Only upcoming/unhandled appointments
- **Completed**: Only finished meetings
- **Cancelled**: Only cancelled appointments

### By Priority
- **All Priorities**: See everything
- **High**: Urgent appointments only
- **Medium**: Normal priority
- **Low**: Low priority

### Search
- Type in the search box to find appointments by:
  - Client name
  - Phone number
  - Purpose/notes

## 📊 Understanding the Statistics

| Stat | Meaning |
|------|---------|
| **Today's Appointments** | How many appointments scheduled for today |
| **Pending** | Total appointments not yet completed |
| **Completed** | Total appointments that have been handled |
| **Total Appointments** | All appointments in the system |

## 🎨 Priority Color Coding

- 🔴 **High Priority** - Red badge with exclamation icon
- 🔵 **Medium Priority** - Blue badge (default)
- ⚪ **Low Priority** - Gray badge

## 📄 PDF Output

The PDF includes:
- School logo
- Date header (e.g., "Monday, November 13, 2024")
- Table with all appointments:
  - Client Name
  - Phone Number
  - Purpose/Notes
- High priority appointments have red background
- Professional formatting for printing

## ⚡ Keyboard Shortcuts

- **Escape**: Close modal
- **Enter**: Submit form (when in form)

## 💡 Pro Tips

1. **Set Priority Wisely**: Use high priority for urgent matters
2. **Add Notes**: Use the notes field for important details
3. **Daily PDF**: Print it every morning for easy reference
4. **Search**: Use search to quickly find a client's appointment
5. **Filter by Date**: Check upcoming appointments in advance

## 🆘 Quick Troubleshooting

### Appointments Not Showing?
- Check if you're logged in as admin
- Try refreshing the page
- Check the date filter (might be set to wrong date)

### Can't Create Appointment?
- Make sure all required fields are filled (marked with *)
- Check that date is valid
- Ensure you're logged in

### PDF Not Downloading?
- Make sure a date is selected
- Check browser's download settings
- Try a different browser

## 📱 Mobile Access

The system works on mobile devices:
- Responsive design
- Touch-friendly buttons
- Mobile-optimized tables

## 🔐 Security Note

- Only admins can access this feature
- All actions are logged with admin name
- Appointments are private and secure

## 📞 Example Scenario

**Client calls at 10:00 AM:**

> **Client**: "Hello, I'd like to schedule a meeting to discuss German language courses."

**Admin actions:**
1. Opens Rendez-vous tab
2. Clicks "New Appointment"
3. Enters:
   - Name: "Sarah Martinez"
   - Phone: "+212 612 345 678"
   - Purpose: "Discuss German language courses - interested in B1 level"
   - Date: Tomorrow
   - Priority: Medium
4. Saves appointment
5. Tells client: "You're scheduled for tomorrow. We'll call you to confirm the time."

**Next day:**
1. Admin downloads today's PDF
2. Sees "Sarah Martinez" on the list
3. Meets with Sarah
4. After meeting, marks appointment as "Completed"

**Done!** ✅

---

## 🎓 Need More Help?

- **Full Documentation**: See `RENDEZ_VOUS_FEATURE.md`
- **Technical Details**: See `RENDEZ_VOUS_IMPLEMENTATION_SUMMARY.md`
- **API Reference**: Check the documentation files

---

**Remember**: This system is designed to be simple and fast. Most tasks take less than 30 seconds!

**Happy Scheduling!** 📅✨
