export class NotificationService {
    async notify(userId: number, message: string, payload?: any) {
        // Placeholder for integration with notification-service
        console.log(`[notify] to ${userId}: ${message}`, payload || '');
    }
}





