import { Request, Response, NextFunction } from 'express';
import { EmailService } from '../services/email.service';
import { PushService } from '../services/push.service';

export class NotificationController {
    private emailService: EmailService;
    private pushService: PushService;

    constructor() {
        this.emailService = new EmailService();
        this.pushService = new PushService();
    }

    // Send Email
    sendEmail = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { to, subject, body } = req.body;
            await this.emailService.send(to, subject, body);
            res.json({ success: true, message: 'Email sent' });
        } catch (error) {
            next(error);
        }
    };

    // Send Push
    sendPush = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId, title, body } = req.body;
            await this.pushService.send(userId, title, body);
            res.json({ success: true, message: 'Push notification sent' });
        } catch (error) {
            next(error);
        }
    };

    // Send SMS
    sendSMS = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { phoneNumber, message } = req.body;
            // TODO: Integrate Twilio
            console.log(`Sending SMS to ${phoneNumber}: ${message}`);
            res.json({ success: true, message: 'SMS sent' });
        } catch (error) {
            next(error);
        }
    };

    // Get User Notifications
    getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.params;
            // TODO: Fetch from DB
            const notifications = [
                { id: 1, title: 'Welcome', body: 'Welcome to Mnbara!', read: false, date: new Date() }
            ];
            res.json({ success: true, data: notifications });
        } catch (error) {
            next(error);
        }
    };
}
