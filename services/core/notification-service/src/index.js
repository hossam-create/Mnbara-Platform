const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const nodemailer = require('nodemailer');
const WebSocket = require('ws');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

// WebSocket server for real-time notifications
const wss = new WebSocket.Server({ port: 8080 });

// Email transporter setup
const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());

// In-memory storage for notifications (replace with database in production)
let notifications = [];
let notificationCounter = 1;

// Connected WebSocket clients
const connectedClients = new Map();

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'auth' && data.userId) {
                connectedClients.set(data.userId, ws);
                console.log(`User ${data.userId} connected for real-time notifications`);
            }
        } catch (error) {
            console.error('WebSocket message parsing error:', error);
        }
    });

    ws.on('close', () => {
        // Remove client from connected clients
        for (const [userId, client] of connectedClients.entries()) {
            if (client === ws) {
                connectedClients.delete(userId);
                console.log(`User ${userId} disconnected from notifications`);
                break;
            }
        }
    });
});

// Helper function to generate notification ID
const generateNotificationId = () => {
    return `NOTIF-${Date.now()}-${notificationCounter++}`;
};

// Helper function to send real-time notification
const sendRealTimeNotification = (userId, notification) => {
    const client = connectedClients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
            type: 'notification',
            data: notification
        }));
    }
};

// Helper function to send email notification
const sendEmailNotification = async (email, subject, htmlContent) => {
    try {
        if (!process.env.SMTP_USER) {
            console.log('Email not configured, skipping email notification');
            return false;
        }

        await emailTransporter.sendMail({
            from: `"Mnbara Platform" <${process.env.SMTP_USER}>`,
            to: email,
            subject: subject,
            html: htmlContent
        });

        console.log(`Email sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'notification-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        connectedClients: connectedClients.size,
        totalNotifications: notifications.length
    });
});

// Send notification
app.post('/api/notifications/send', async (req, res) => {
    try {
        const { 
            userId, 
            type, 
            title, 
            message, 
            email, 
            sendEmail = false,
            sendRealTime = true,
            metadata = {} 
        } = req.body;

        // Validate required fields
        if (!userId || !type || !title || !message) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'userId, type, title, and message are required'
            });
        }

        // Create notification object
        const notification = {
            id: generateNotificationId(),
            userId,
            type,
            title,
            message,
            metadata,
            read: false,
            createdAt: new Date().toISOString()
        };

        // Store notification
        notifications.push(notification);

        // Send real-time notification if requested
        if (sendRealTime) {
            sendRealTimeNotification(userId, notification);
        }

        // Send email notification if requested and email provided
        let emailSent = false;
        if (sendEmail && email) {
            const emailTemplate = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                        <h1 style="color: #007bff; margin: 0;">Mnbara Platform</h1>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #333; margin-bottom: 20px;">${title}</h2>
                        <p style="color: #666; line-height: 1.6; font-size: 16px;">${message}</p>
                        ${metadata.actionUrl ? `
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${metadata.actionUrl}" 
                                   style="background-color: #007bff; color: white; padding: 12px 30px; 
                                          text-decoration: none; border-radius: 5px; display: inline-block;">
                                    View Details
                                </a>
                            </div>
                        ` : ''}
                    </div>
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
                        <p>© 2026 Mnbara Platform. All rights reserved.</p>
                        <p>This is an automated message, please do not reply.</p>
                    </div>
                </div>
            `;

            emailSent = await sendEmailNotification(email, title, emailTemplate);
        }

        res.status(201).json({
            success: true,
            notification: {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                createdAt: notification.createdAt
            },
            realTimeSent: sendRealTime,
            emailSent: emailSent
        });

    } catch (error) {
        console.error('Notification sending error:', error);
        res.status(500).json({
            error: 'Notification sending failed',
            message: error.message
        });
    }
});

// Get notifications for user
app.get('/api/notifications', (req, res) => {
    try {
        const { userId, unreadOnly = false, limit = 20, offset = 0 } = req.query;

        if (!userId) {
            return res.status(400).json({
                error: 'Missing user ID',
                message: 'User ID is required to retrieve notifications'
            });
        }

        let userNotifications = notifications.filter(n => n.userId === userId);

        // Filter unread only if requested
        if (unreadOnly === 'true') {
            userNotifications = userNotifications.filter(n => !n.read);
        }

        // Sort by creation date (newest first)
        userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Apply pagination
        const paginatedNotifications = userNotifications.slice(
            parseInt(offset), 
            parseInt(offset) + parseInt(limit)
        );

        res.json({
            success: true,
            notifications: paginatedNotifications,
            pagination: {
                total: userNotifications.length,
                unread: userNotifications.filter(n => !n.read).length,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: userNotifications.length > parseInt(offset) + parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Notifications retrieval error:', error);
        res.status(500).json({
            error: 'Notifications retrieval failed',
            message: error.message
        });
    }
});

// Mark notification as read
app.put('/api/notifications/:notificationId/read', (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = notifications.find(n => n.id === notificationId);

        if (!notification) {
            return res.status(404).json({
                error: 'Notification not found',
                message: `Notification with ID ${notificationId} does not exist`
            });
        }

        notification.read = true;
        notification.readAt = new Date().toISOString();

        res.json({
            success: true,
            notification: {
                id: notification.id,
                read: notification.read,
                readAt: notification.readAt
            }
        });

    } catch (error) {
        console.error('Notification update error:', error);
        res.status(500).json({
            error: 'Notification update failed',
            message: error.message
        });
    }
});

// Mark all notifications as read for user
app.put('/api/notifications/read-all', (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                error: 'Missing user ID',
                message: 'User ID is required'
            });
        }

        const userNotifications = notifications.filter(n => n.userId === userId && !n.read);
        const readAt = new Date().toISOString();

        userNotifications.forEach(notification => {
            notification.read = true;
            notification.readAt = readAt;
        });

        res.json({
            success: true,
            message: `Marked ${userNotifications.length} notifications as read`,
            count: userNotifications.length
        });

    } catch (error) {
        console.error('Bulk notification update error:', error);
        res.status(500).json({
            error: 'Bulk notification update failed',
            message: error.message
        });
    }
});

// Delete notification
app.delete('/api/notifications/:notificationId', (req, res) => {
    try {
        const { notificationId } = req.params;
        const notificationIndex = notifications.findIndex(n => n.id === notificationId);

        if (notificationIndex === -1) {
            return res.status(404).json({
                error: 'Notification not found',
                message: `Notification with ID ${notificationId} does not exist`
            });
        }

        notifications.splice(notificationIndex, 1);

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });

    } catch (error) {
        console.error('Notification deletion error:', error);
        res.status(500).json({
            error: 'Notification deletion failed',
            message: error.message
        });
    }
});

// Send welcome email template
app.post('/api/notifications/welcome-email', async (req, res) => {
    try {
        const { email, firstName, userId } = req.body;

        if (!email || !firstName) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Email and firstName are required'
            });
        }

        const welcomeTemplate = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #007bff; padding: 40px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to Mnbara!</h1>
                </div>
                <div style="padding: 40px 20px;">
                    <h2 style="color: #333; margin-bottom: 20px;">Hello ${firstName}! 👋</h2>
                    <p style="color: #666; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
                        Welcome to Mnbara Platform - the premier marketplace for buying and selling amazing products!
                    </p>
                    <p style="color: #666; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
                        You're now part of a growing community of buyers and sellers. Here's what you can do:
                    </p>
                    <ul style="color: #666; line-height: 1.8; font-size: 16px; margin-bottom: 30px;">
                        <li>🛍️ Browse thousands of products</li>
                        <li>💰 Sell your own items</li>
                        <li>⭐ Rate and review products</li>
                        <li>📱 Access from any device</li>
                    </ul>
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="https://mnbara.com" 
                           style="background-color: #007bff; color: white; padding: 15px 40px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
                            Start Shopping
                        </a>
                    </div>
                </div>
                <div style="background-color: #f8f9fa; padding: 30px 20px; text-align: center;">
                    <p style="color: #666; font-size: 14px; margin: 0;">
                        Need help? Contact us at <a href="mailto:support@mnbara.com">support@mnbara.com</a>
                    </p>
                    <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
                        © 2026 Mnbara Platform. All rights reserved.
                    </p>
                </div>
            </div>
        `;

        const emailSent = await sendEmailNotification(
            email, 
            'Welcome to Mnbara Platform! 🎉', 
            welcomeTemplate
        );

        // Also create in-app notification
        if (userId) {
            const notification = {
                id: generateNotificationId(),
                userId,
                type: 'welcome',
                title: 'Welcome to Mnbara! 🎉',
                message: `Hello ${firstName}! Welcome to our marketplace. Start exploring amazing products and deals.`,
                metadata: { actionUrl: 'https://mnbara.com' },
                read: false,
                createdAt: new Date().toISOString()
            };

            notifications.push(notification);
            sendRealTimeNotification(userId, notification);
        }

        res.json({
            success: true,
            message: 'Welcome email sent successfully',
            emailSent: emailSent
        });

    } catch (error) {
        console.error('Welcome email error:', error);
        res.status(500).json({
            error: 'Welcome email sending failed',
            message: error.message
        });
    }
});

// Get notification statistics
app.get('/api/notifications/stats', (req, res) => {
    try {
        const { userId } = req.query;

        let filteredNotifications = notifications;
        if (userId) {
            filteredNotifications = notifications.filter(n => n.userId === userId);
        }

        const stats = {
            total: filteredNotifications.length,
            unread: filteredNotifications.filter(n => !n.read).length,
            read: filteredNotifications.filter(n => n.read).length,
            typeBreakdown: {},
            connectedClients: connectedClients.size
        };

        // Calculate type breakdown
        filteredNotifications.forEach(notification => {
            stats.typeBreakdown[notification.type] = (stats.typeBreakdown[notification.type] || 0) + 1;
        });

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Notification stats error:', error);
        res.status(500).json({
            error: 'Notification stats retrieval failed',
            message: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Notification service error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong in notification service'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: 'Notification service endpoint not found'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Notification Service running on port ${PORT}`);
    console.log(`🔌 WebSocket server running on port 8080`);
    console.log(`📧 Email service: ${process.env.SMTP_USER ? 'Configured' : 'Not configured'}`);
    console.log(`🌐 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});