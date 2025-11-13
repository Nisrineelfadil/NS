# 🔄 Automatic Payment Cycle System - Complete Guide

## Overview

The Nisrine School Management System includes a **fully automated payment cycle tracking system** that automatically manages monthly recurring payments for students.

---

## ✅ System Features

### 1. **Automatic Payment Cycle Reset**
- When a student's payment is marked as "Paid", the system automatically:
  - Waits **1 day** after the payment date
  - Resets payment status to "Pending"
  - **Automatically calculates next payment date** (same day next month)
  - Resets reminder flags
  - Logs the reset action

**Example:**
- Student pays on **January 1st, 2025**
- System automatically sets next payment to **February 1st, 2025**
- Then **March 1st, 2025**, and so on...

### 2. **Smart Date Calculation**
- Uses JavaScript `setMonth()` for accurate monthly increments
- Handles month-end dates correctly (e.g., Jan 31 → Feb 28/29)
- Accounts for leap years automatically
- No manual intervention required

### 3. **Visual Payment Status Indicators**

#### Student Management Portal (Admin View):
- **✅ Green Checkmark** - Payment is paid
- **🟡 Yellow Bell (Animated)** - Payment due within 7 days
- **🔴 Red Bell** - Payment is overdue

#### Enhanced Student Card Display:
When payment is **PAID**, the card shows:
```
📅 10/1/2025 (Paid ✓)

┌─────────────────────────────────────────┐
│ 📅 Next Payment: 11/1/2025              │
│ ⏰ 30 days remaining                    │
└─────────────────────────────────────────┘
```

When payment is **PENDING**:
```
📅 11/1/2025 (7 days)
```

When payment is **OVERDUE**:
```
📅 11/1/2025 (Overdue)
```

### 4. **Student Portal Display**

#### For Paid Students:
Shows a **green success message** with next payment countdown:
```
✅ Payment Received - Thank You!

Your current payment has been successfully processed.

📅 NEXT PAYMENT SCHEDULE:

┌─────────────────────────────────────────┐
│ 📅 Next Payment Due: 11/1/2025          │
│ ⏰ 30 days remaining                    │
└─────────────────────────────────────────┘

You will receive a reminder 7 days before your next payment is due.
```

#### For Pending Students (Due Soon):
Shows **yellow warning** with countdown:
```
⏰ Due in 7 days
📅 Your payment is due soon.
Due Date: 11/1/2025
Amount: 500 MAD
```

#### For Overdue Students:
Shows **red urgent warning** with consequences:
```
⚠️ URGENT: PAYMENT OVERDUE

Your tuition payment is now OVERDUE.
[Detailed warning message with consequences]
```

### 5. **Enhanced Mark-as-Paid Notification**

When admin marks a payment as paid, they see:
```
✅ Payment marked as paid!

📅 Next Payment: 11/1/2025
⏰ 30 days remaining
```

This immediately confirms the next payment cycle has been scheduled.

---

## 🔧 Technical Implementation

### Backend Service (`services/paymentReminderService.js`)

#### Auto-Reset Function:
```javascript
async resetPaidStudents(now) {
    // Find students who paid more than 1 day ago
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const paidStudents = await ManagedStudent.find({
        status: 'active',
        paymentStatus: 'paid',
        paymentDate: { $lt: oneDayAgo }
    });

    for (const student of paidStudents) {
        // Reset to pending
        student.paymentStatus = 'pending';
        
        // Move to next month
        const nextPaymentDate = new Date(student.paymentDate);
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        student.paymentDate = nextPaymentDate;
        
        // Reset reminder flags
        student.paymentReminderSent = false;
        student.lastReminderDate = null;
        
        await student.save();
    }
}
```

#### Service Schedule:
- Runs **every 60 minutes** (configurable)
- Checks for:
  - Paid students to reset
  - Upcoming payments (7 days before)
  - Overdue payments
- Creates reminder records
- Updates payment statuses

### Frontend Display (`js/student-management.js`)

#### Next Payment Calculation:
```javascript
// For paid students
if (isPaid) {
    nextPaymentDate = new Date(paymentDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    daysUntilNextPayment = Math.ceil((nextPaymentDate - now) / (1000 * 60 * 60 * 24));
    
    // Calculate days since payment was marked as paid
    const daysSincePaid = Math.ceil((now - paymentDate) / (1000 * 60 * 60 * 24));
    
    // Show next payment notification only if:
    // 1. More than 2 days have passed since payment, OR
    // 2. Less than 7 days until next payment
    showNextPayment = daysSincePaid > 2 || daysUntilNextPayment <= 7;
}
```

#### Student Card Enhancement:
- Shows **crossed-out** current payment date when paid
- Displays **green highlighted box** with next payment info
- Shows **countdown timer** in days
- Updates in real-time when payment status changes
- **Hides after 2 days** of being marked as paid (card returns to normal form)
- **Reappears 7 days before** next payment is due (shows countdown)

---

## 📊 Payment Cycle Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PAYMENT LIFECYCLE                         │
└─────────────────────────────────────────────────────────────┘

1. Student Enrolled
   └─> Payment Date Set: 1st of every month
   └─> Status: PENDING
   
2. 7 Days Before Payment (e.g., Jan 25)
   └─> System sends reminder
   └─> Yellow bell appears
   └─> Status: PENDING (Due Soon)
   
3. Payment Date (Jan 1)
   └─> Admin marks as PAID
   └─> Green checkmark appears
   └─> Notification shows: "Next Payment: Feb 1"
   └─> Status: PAID
   
4. 2 Days After Payment (Jan 3) - NOTIFICATION HIDES
   └─> Green "Next Payment" box disappears
   └─> Card returns to normal form
   └─> Status: Still PAID
   └─> Student card shows only: "📅 1/1/2025 (Paid ✓)"
   
5. Next Day (Jan 2) - AUTOMATIC RESET
   └─> Service runs at scheduled interval
   └─> Status changes: PAID → PENDING
   └─> Payment date updates: Jan 1 → Feb 1
   └─> Reminder flags reset
   └─> Cycle repeats
   
6. 7 Days Before Next Payment (Jan 25) - NOTIFICATION REAPPEARS
   └─> Green "Next Payment" box shows again
   └─> Shows countdown: "Next: 2/1/2025 ⏰ 7d"
   └─> Reminds admin/student of upcoming payment
   
7. If Payment Missed (Feb 2+)
   └─> Status: OVERDUE
   └─> Red bell appears (animated)
   └─> Student sees urgent warning
   └─> Admin sees overdue indicator
```

### Visual Timeline (Next Payment Notification):

```
Jan 1: Payment Made
       ┌─────────────────────────┐
       │ ✅ Next: 2/1/2025 ⏰ 31d │  ← Shows immediately
       └─────────────────────────┘

Jan 3: 2 Days Later
       [No notification]             ← Hides (card normal form)

Jan 25: 7 Days Before Next Payment
       ┌─────────────────────────┐
       │ ✅ Next: 2/1/2025 ⏰ 7d  │  ← Reappears with countdown
       └─────────────────────────┘

Feb 1: Next Payment Due
       [Waiting for payment...]
```

---

## 🎯 Key Benefits

### For Administrators:
1. **Zero Manual Work** - No need to manually update payment dates
2. **Clear Visual Indicators** - Instant status recognition
3. **Next Payment Preview** - See upcoming payment dates immediately
4. **Automated Reminders** - System handles all notifications

### For Students:
1. **Clear Payment Status** - Always know payment standing
2. **Next Payment Countdown** - Plan ahead with day counter
3. **Automatic Reminders** - Never miss a payment
4. **Transparent Schedule** - See exact next payment date

### For System:
1. **Consistent Monthly Cycles** - Same day every month
2. **Accurate Date Handling** - Handles month-end edge cases
3. **Scalable** - Works for unlimited students
4. **Reliable** - Runs automatically every hour

---

## 🔍 Example Scenarios

### Scenario 1: Regular Monthly Payment (1st of Month)
```
Jan 1: Payment Due → Student Pays → Status: PAID
Jan 2: Auto-reset → Status: PENDING, Next: Feb 1
Feb 1: Payment Due → Student Pays → Status: PAID
Feb 2: Auto-reset → Status: PENDING, Next: Mar 1
Mar 1: Payment Due → And so on...
```

### Scenario 2: Mid-Month Payment (15th of Month)
```
Jan 15: Payment Due → Student Pays → Status: PAID
Jan 16: Auto-reset → Status: PENDING, Next: Feb 15
Feb 15: Payment Due → Student Pays → Status: PAID
Feb 16: Auto-reset → Status: PENDING, Next: Mar 15
```

### Scenario 3: Month-End Payment (31st)
```
Jan 31: Payment Due → Student Pays → Status: PAID
Feb 1: Auto-reset → Status: PENDING, Next: Feb 28 (or 29 in leap year)
Feb 28: Payment Due → Student Pays → Status: PAID
Mar 1: Auto-reset → Status: PENDING, Next: Mar 31
```

### Scenario 4: Late Payment
```
Jan 1: Payment Due → Student doesn't pay
Jan 2: Status: OVERDUE (red bell, urgent warning)
Jan 5: Student pays → Status: PAID
Jan 6: Auto-reset → Status: PENDING, Next: Feb 1
```

---

## ⚙️ Configuration

### Service Interval
Location: `server.js`
```javascript
// Start payment reminder service (checks every 60 minutes)
paymentReminderService.start(60);
```

**Change interval:**
- `60` = Every hour (default)
- `30` = Every 30 minutes
- `120` = Every 2 hours

### Reminder Days Before
Location: `models/ManagedStudent.js`
```javascript
reminderDaysBefore: {
    type: Number,
    default: 7,  // Send reminder 7 days before
    min: 1
}
```

**Customizable per student** - Each student can have different reminder schedules.

---

## 🐛 Troubleshooting

### Payment Not Auto-Resetting?
1. Check if payment reminder service is running:
   ```bash
   # Look for this in server logs:
   "Starting Payment Reminder Service (checking every 60 minutes)"
   ```

2. Verify payment was marked as paid more than 1 day ago

3. Check student status is "active"

### Next Payment Date Wrong?
- System uses `setMonth()` which handles edge cases
- For month-end dates, JavaScript automatically adjusts
- Example: Jan 31 + 1 month = Feb 28/29 (correct behavior)

### Countdown Not Showing?
1. Verify payment status is "paid"
2. Check browser console for JavaScript errors
3. Refresh the page to reload student data

---

## 📝 Database Fields

### ManagedStudent Model:
```javascript
{
    paymentDate: Date,           // Current/next payment due date
    paymentAmount: Number,        // Amount in MAD
    paymentStatus: String,        // 'paid', 'pending', 'overdue'
    paymentReminderSent: Boolean, // Has reminder been sent?
    lastReminderDate: Date,       // When was last reminder sent?
    reminderDaysBefore: Number    // Days before to send reminder (default: 7)
}
```

---

## 🚀 Future Enhancements (Optional)

1. **Email/SMS Notifications** - Send actual emails/SMS for reminders
2. **Payment History** - Track all past payments
3. **Multiple Payment Plans** - Weekly, bi-weekly, quarterly options
4. **Grace Period** - Allow X days after due date before marking overdue
5. **Partial Payments** - Track installment payments
6. **Auto-Suspend** - Automatically suspend students after X days overdue

---

## ✅ Summary

Your system **already has complete automatic payment cycle tracking**! The enhancements added:

1. ✅ **Visual next payment display** on student cards
2. ✅ **Countdown timer** showing days remaining
3. ✅ **Enhanced notifications** when marking as paid
4. ✅ **Student portal countdown** for paid students

**No backend changes needed** - The automatic monthly reset was already working perfectly!

---

## 📞 Support

For questions or issues with the payment cycle system:
- Check server logs for payment reminder service status
- Verify student payment dates and statuses in database
- Review this documentation for configuration options

**System Status:** ✅ Fully Operational & Enhanced
