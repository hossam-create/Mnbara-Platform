export class EmailService {
    async send(to: string, subject: string, body: string): Promise<void> {
        // TODO: Integrate AWS SES or Nodemailer
        console.log(`Sending Email to ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${body}`);
    }
}
