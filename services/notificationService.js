const Notification = require('../models/Notification');
// const pushService = require('./pushNotificationService'); // DISABLED - Push notifications temporarily disabled

// Store Socket.IO instance
let io = null;

// Initialize Socket.IO
function initializeSocketIO(socketIO) {
    io = socketIO;
    console.log('✅ Notification service initialized with Socket.IO');
}

// Emit notification to all connected admin clients
function emitNotification(notification) {
    if (io) {
        io.emit('new-notification', notification);
        console.log(`📢 Notification emitted: ${notification.type} - ${notification.title}`);
    }
}

// Create and emit notification for new registration
async function notifyNewRegistration(student) {
    try {
        const notification = await Notification.createNotification({
            type: 'registration',
            title: 'New Student Registration',
            message: `${student.fullName} has registered for ${student.formationChoisie.join(', ')}`,
            relatedId: student._id,
            relatedModel: 'Student',
            metadata: {
                studentName: student.fullName,
                serviceType: student.formationChoisie.join(', ')
            }
        });
        
        emitNotification(notification);
        return notification;
    } catch (error) {
        console.error('Error creating registration notification:', error);
    }
}

// Create and emit notification for new service request
async function notifyNewServiceRequest(serviceRequest) {
    try {
        const serviceTypeMap = {
            'cv': 'CV Service',
            'applying': 'Job Application',
            'translation': 'Translation Service'
        };
        
        const notification = await Notification.createNotification({
            type: 'service_request',
            title: 'New Service Request',
            message: `${serviceRequest.fullName} requested ${serviceTypeMap[serviceRequest.serviceType]}`,
            relatedId: serviceRequest._id,
            relatedModel: 'ServiceRequest',
            metadata: {
                studentName: serviceRequest.fullName,
                serviceType: serviceRequest.serviceType
            }
        });
        
        emitNotification(notification);
        return notification;
    } catch (error) {
        console.error('Error creating service request notification:', error);
    }
}

// Create and emit notification for new rating
async function notifyNewRating(rating) {
    try {
        const stars = '⭐'.repeat(rating.stars);
        
        const notification = await Notification.createNotification({
            type: 'rating',
            title: 'New Rating Submitted',
            message: `${rating.name} gave ${stars} (${rating.stars}/5)`,
            relatedId: rating._id,
            relatedModel: 'Rating',
            metadata: {
                studentName: rating.name,
                rating: rating.stars
            }
        });
        
        emitNotification(notification);
        return notification;
    } catch (error) {
        console.error('Error creating rating notification:', error);
    }
}

// Create and emit notification for new appointment
async function notifyNewAppointment(appointment) {
    try {
        const notification = await Notification.createNotification({
            type: 'appointment',
            title: 'New Appointment',
            message: `${appointment.fullName} scheduled appointment for ${appointment.purpose}`,
            relatedId: appointment._id,
            relatedModel: 'Appointment',
            metadata: {
                studentName: appointment.fullName,
                appointmentDate: appointment.appointmentDate,
                priority: appointment.priority
            }
        });
        
        emitNotification(notification);
        return notification;
    } catch (error) {
        console.error('Error creating appointment notification:', error);
    }
}

// Create and emit notification for new message
async function notifyNewMessage(message) {
    try {
        const notification = await Notification.createNotification({
            type: 'message',
            title: 'New Contact Message',
            message: `${message.fullName} sent a message`,
            relatedId: message._id,
            relatedModel: 'Message',
            metadata: {
                studentName: message.fullName
            }
        });
        
        emitNotification(notification);
        return notification;
    } catch (error) {
        console.error('Error creating message notification:', error);
    }
}

// Create and emit notification for new job application
async function notifyNewJobApplication(application) {
    try {
        const notification = await Notification.createNotification({
            type: 'service_request',
            title: 'New Job Application',
            message: `${application.fullName} submitted a job application (${application.requestedJobType || 'Bewerbung'})`,
            relatedId: application._id,
            relatedModel: 'JobApplication',
            metadata: {
                studentName: application.fullName,
                serviceType: 'applying',
                requestedJobType: application.requestedJobType
            }
        });
        
        emitNotification(notification);
        return notification;
    } catch (error) {
        console.error('Error creating job application notification:', error);
    }
}

// ==================== NEW: STUDENT PUSH NOTIFICATIONS ====================

// Send push notification for new grade upload
async function notifyGradeUploaded(studentId, gradeData) {
    try {
        const payload = {
            title: '📊 New Grade Available',
            body: `Your ${gradeData.formation} grade has been uploaded: ${gradeData.score}/${gradeData.maxScore}`,
            icon: '/pwa/icon-192.png',
            badge: '/pwa/icon-192.png',
            data: {
                type: 'grade',
                gradeId: gradeData._id,
                formation: gradeData.formation,
                score: gradeData.score,
                timestamp: new Date().toISOString()
            }
        };

        // await pushService.sendToStudent(studentId, payload); // DISABLED
        console.log(`📤 Grade notification sent to student ${studentId} (push disabled)`);
    } catch (error) {
        console.error('Error sending grade push notification:', error);
    }
}

// Send push notification for attendance code generation
async function notifyAttendanceCodeGenerated(studentIds, sessionData) {
    try {
        const payload = {
            title: '✅ Attendance Code Available',
            body: `Mark your attendance for ${sessionData.formation} class. Code expires in ${sessionData.qrValidityMinutes} minutes!`,
            icon: '/pwa/icon-192.png',
            badge: '/pwa/icon-192.png',
            data: {
                type: 'attendance',
                sessionId: sessionData.sessionId,
                formation: sessionData.formation,
                groupName: sessionData.groupName,
                expiresAt: sessionData.qrExpiresAt,
                timestamp: new Date().toISOString()
            },
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 200]
        };

        // await pushService.sendToMultipleStudents(studentIds, payload); // DISABLED
        console.log(`📤 Attendance notification sent to ${studentIds.length} students (push disabled)`);
    } catch (error) {
        console.error('Error sending attendance push notification:', error);
    }
}

// Send push notification for admin message
async function notifyAdminMessage(studentId, messageData) {
    try {
        const payload = {
            title: '💬 New Message from Admin',
            body: messageData.message.substring(0, 100) + (messageData.message.length > 100 ? '...' : ''),
            icon: '/pwa/icon-192.png',
            badge: '/pwa/icon-192.png',
            data: {
                type: 'admin_message',
                messageId: messageData._id,
                messageType: messageData.type,
                timestamp: new Date().toISOString()
            }
        };

        // await pushService.sendToStudent(studentId, payload); // DISABLED
        console.log(`📤 Admin message notification sent to student ${studentId} (push disabled)`);
    } catch (error) {
        console.error('Error sending admin message push notification:', error);
    }
}

// Send push notification for payment due
async function notifyPaymentDue(studentId, paymentData) {
    try {
        const daysOverdue = Math.floor((new Date() - new Date(paymentData.paymentDate)) / (1000 * 60 * 60 * 24));
        
        let title, body;
        if (paymentData.paymentStatus === 'overdue') {
            title = '⚠️ Payment Overdue';
            body = `Your payment of ${paymentData.paymentAmount} MAD is ${daysOverdue} day(s) overdue. Please pay as soon as possible.`;
        } else {
            title = '💰 Payment Reminder';
            body = `Your payment of ${paymentData.paymentAmount} MAD is due soon. Due date: ${new Date(paymentData.paymentDate).toLocaleDateString()}`;
        }

        const payload = {
            title,
            body,
            icon: '/pwa/icon-192.png',
            badge: '/pwa/icon-192.png',
            data: {
                type: 'payment',
                paymentAmount: paymentData.paymentAmount,
                paymentDate: paymentData.paymentDate,
                paymentStatus: paymentData.paymentStatus,
                daysOverdue: daysOverdue,
                timestamp: new Date().toISOString()
            },
            requireInteraction: paymentData.paymentStatus === 'overdue'
        };

        // await pushService.sendToStudent(studentId, payload); // DISABLED
        console.log(`📤 Payment notification sent to student ${studentId} (push disabled)`);
    } catch (error) {
        console.error('Error sending payment push notification:', error);
    }
}

// Send bulk payment reminders (for daily cron job)
async function notifyBulkPaymentReminders(studentsData) {
    try {
        const promises = studentsData.map(student => 
            notifyPaymentDue(student._id, {
                paymentAmount: student.paymentAmount,
                paymentDate: student.paymentDate,
                paymentStatus: student.paymentStatus
            })
        );

        await Promise.allSettled(promises);
        console.log(`📤 Bulk payment reminders sent to ${studentsData.length} students`);
    } catch (error) {
        console.error('Error sending bulk payment reminders:', error);
    }
}

module.exports = {
    initializeSocketIO,
    emitNotification,
    notifyNewRegistration,
    notifyNewServiceRequest,
    notifyNewRating,
    notifyNewAppointment,
    notifyNewMessage,
    notifyNewJobApplication,
    // NEW: Student push notifications
    notifyGradeUploaded,
    notifyAttendanceCodeGenerated,
    notifyAdminMessage,
    notifyPaymentDue,
    notifyBulkPaymentReminders
};
