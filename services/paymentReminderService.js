const ManagedStudent = require('../models/ManagedStudent');
const PaymentReminder = require('../models/PaymentReminder');

class PaymentReminderService {
    constructor() {
        this.checkInterval = null;
    }

    // Start the automated reminder checking service
    start(intervalMinutes = 60) {
        console.log(`Starting Payment Reminder Service (checking every ${intervalMinutes} minutes)`);
        
        // Run immediately on start
        this.checkReminders();
        
        // Then run at intervals
        this.checkInterval = setInterval(() => {
            this.checkReminders();
        }, intervalMinutes * 60 * 1000);
    }

    // Stop the service
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('Payment Reminder Service stopped');
        }
    }

    // Normalize date to start of day (removes time component)
    normalizeDate(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    // Check for students who need payment reminders
    async checkReminders() {
        try {
            console.log('🔔 Checking for payment reminders...');
            const now = new Date();
            const today = this.normalizeDate(now);
            
            // STEP 1: Reset paid students one day after payment date
            await this.resetPaidStudents(now);
            
            // STEP 2: Find active students with pending payments
            const students = await ManagedStudent.find({
                status: 'active',
                paymentStatus: { $ne: 'paid' }
            });

            let upcomingCount = 0;
            let overdueCount = 0;

            for (const student of students) {
                const paymentDate = this.normalizeDate(student.paymentDate);
                
                // Check if payment is overdue (compare dates without time)
                if (today > paymentDate && student.paymentStatus !== 'overdue') {
                    student.paymentStatus = 'overdue';
                    await student.save();
                    overdueCount++;
                    
                    // Create overdue reminder if not already sent recently (every 7 days)
                    const recentReminder = await PaymentReminder.findOne({
                        student: student._id,
                        reminderType: 'overdue',
                        sentAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
                    });
                    
                    if (!recentReminder) {
                        await this.createReminder(student, 'overdue');
                        console.log(`📧 Sent overdue reminder to ${student.fullName}`);
                    }
                }
                // Check if reminder should be sent for upcoming payment
                else if (student.paymentStatus === 'pending') {
                    const reminderDate = new Date(student.paymentDate);
                    reminderDate.setDate(reminderDate.getDate() - student.reminderDaysBefore);
                    
                    if (now >= reminderDate && now < student.paymentDate && !student.paymentReminderSent) {
                        upcomingCount++;
                        
                        // Create upcoming payment reminder
                        await this.createReminder(student, 'upcoming');
                        
                        // Mark as sent
                        student.paymentReminderSent = true;
                        student.lastReminderDate = now;
                        await student.save();
                    }
                }
            }

            console.log(`Payment reminder check complete: ${upcomingCount} upcoming, ${overdueCount} overdue`);
            
            return {
                upcomingCount,
                overdueCount,
                checkedAt: now
            };
        } catch (error) {
            console.error('Error checking payment reminders:', error);
            throw error;
        }
    }

    // Reset paid students one day after their payment date
    async resetPaidStudents(now) {
        try {
            // Find students who paid but their payment date was more than 1 day ago
            const oneDayAgo = new Date(now);
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);
            
            const paidStudents = await ManagedStudent.find({
                status: 'active',
                paymentStatus: 'paid',
                paymentDate: { $lt: oneDayAgo } // Payment date is more than 1 day ago
            });

            let resetCount = 0;
            
            for (const student of paidStudents) {
                // Reset payment status to pending
                student.paymentStatus = 'pending';
                
                // Move payment date to next month (use setMonth for accurate month addition)
                const nextPaymentDate = new Date(student.paymentDate);
                nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
                student.paymentDate = nextPaymentDate;
                
                // Reset reminder flags
                student.paymentReminderSent = false;
                student.lastReminderDate = null;
                
                await student.save();
                resetCount++;
                
                console.log(`✅ Reset payment for ${student.fullName} - Next payment: ${nextPaymentDate.toLocaleDateString()}`);
            }

            if (resetCount > 0) {
                console.log(`✅ Reset ${resetCount} paid student(s) for next payment cycle`);
            }
            
            return resetCount;
        } catch (error) {
            console.error('Error resetting paid students:', error);
            throw error;
        }
    }

    // Create a payment reminder record
    async createReminder(student, type) {
        try {
            const reminder = new PaymentReminder({
                student: student._id,
                studentName: student.fullName,
                paymentDate: student.paymentDate,
                reminderType: type,
                method: 'system',
                status: 'sent',
                notes: `Automated ${type} payment reminder`
            });

            await reminder.save();
            console.log(`Created ${type} reminder for student: ${student.fullName}`);
            
            return reminder;
        } catch (error) {
            console.error('Error creating reminder:', error);
            throw error;
        }
    }

    // Get all pending reminders
    async getPendingReminders() {
        try {
            const now = new Date();
            
            const students = await ManagedStudent.find({
                status: 'active',
                paymentStatus: { $ne: 'paid' }
            })
            .populate('group', 'name')
            .sort({ paymentDate: 1 });

            const reminders = [];

            for (const student of students) {
                const reminderDate = new Date(student.paymentDate);
                reminderDate.setDate(reminderDate.getDate() - student.reminderDaysBefore);
                
                const isOverdue = now > student.paymentDate;
                const shouldRemind = now >= reminderDate && now < student.paymentDate;
                const daysUntilPayment = Math.ceil((student.paymentDate - now) / (1000 * 60 * 60 * 24));

                if (isOverdue || shouldRemind) {
                    reminders.push({
                        student: {
                            _id: student._id,
                            fullName: student.fullName,
                            phoneNumber: student.phoneNumber,
                            parentPhone: student.parentPhone,
                            schoolEmail: student.schoolEmail,
                            groupName: student.groupName,
                            paymentAmount: student.paymentAmount,
                            paymentDate: student.paymentDate,
                            paymentStatus: student.paymentStatus
                        },
                        reminderDate,
                        isOverdue,
                        shouldRemind,
                        daysUntilPayment,
                        reminderSent: student.paymentReminderSent,
                        lastReminderDate: student.lastReminderDate
                    });
                }
            }

            return reminders;
        } catch (error) {
            console.error('Error getting pending reminders:', error);
            throw error;
        }
    }

    // Get reminder statistics
    async getStatistics(days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const reminders = await PaymentReminder.find({
                sentAt: { $gte: startDate }
            });

            const stats = {
                total: reminders.length,
                byType: {},
                byMethod: {},
                byStatus: {}
            };

            reminders.forEach(reminder => {
                // Count by type
                stats.byType[reminder.reminderType] = (stats.byType[reminder.reminderType] || 0) + 1;
                
                // Count by method
                stats.byMethod[reminder.method] = (stats.byMethod[reminder.method] || 0) + 1;
                
                // Count by status
                stats.byStatus[reminder.status] = (stats.byStatus[reminder.status] || 0) + 1;
            });

            return stats;
        } catch (error) {
            console.error('Error getting reminder statistics:', error);
            throw error;
        }
    }

    // Reset reminder flag for a student (when payment date is extended)
    async resetStudentReminder(studentId) {
        try {
            const student = await ManagedStudent.findById(studentId);
            if (!student) {
                throw new Error('Student not found');
            }

            student.paymentReminderSent = false;
            student.lastReminderDate = null;
            await student.save();

            console.log(`Reset reminder flag for student: ${student.fullName}`);
            return student;
        } catch (error) {
            console.error('Error resetting student reminder:', error);
            throw error;
        }
    }
}

// Export singleton instance
module.exports = new PaymentReminderService();
