export class PushService {
    async send(userId: string, title: string, body: string): Promise<void> {
        // TODO: Integrate Firebase Cloud Messaging (FCM)
        console.log(`Sending Push to User ${userId}`);
        console.log(`Title: ${title}`);
        console.log(`Body: ${body}`);
    }
}
