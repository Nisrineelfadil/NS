const Notification = require('../models/Notification');

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

module.exports = {
    initializeSocketIO,
    emitNotification,
    notifyNewRegistration,
    notifyNewServiceRequest,
    notifyNewRating,
    notifyNewAppointment,
    notifyNewMessage
};
