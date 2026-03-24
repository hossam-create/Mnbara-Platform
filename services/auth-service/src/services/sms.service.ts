import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client (only if credentials are available)
const twilioClient = accountSid && authToken
    ? twilio(accountSid, authToken)
    : null;

export class SmsService {
    /**
     * Send OTP code via SMS
     */
    async sendOtp(phoneNumber: string, otpCode: string): Promise<boolean> {
        if (!twilioClient || !fromNumber) {
            // In development/test, log instead of sending
            console.log(`[SMS] Would send OTP ${otpCode} to ${phoneNumber}`);
            return true; // Return true for development
        }

        try {
            // Normalize phone number (ensure it starts with +)
            const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

            const message = await twilioClient.messages.create({
                body: `Your MNBARA verification code is: ${otpCode}. This code expires in 10 minutes.`,
                from: fromNumber,
                to: normalizedPhone,
            });

            console.log(`SMS sent successfully. SID: ${message.sid}`);
            return true;
        } catch (error: any) {
            console.error('Error sending SMS:', error);
            throw new Error(`Failed to send SMS: ${error.message}`);
        }
    }

    /**
     * Normalize phone number to E.164 format
     */
    private normalizePhoneNumber(phone: string): string {
        // Remove all non-digit characters except +
        const normalized = phone.replace(/[^\d+]/g, '');

        // If it doesn't start with +, assume it needs country code
        // For now, we'll require + prefix from frontend
        // In production, you might want to add country code detection
        if (!normalized.startsWith('+')) {
            throw new Error('Phone number must include country code (e.g., +1234567890)');
        }

        return normalized;
    }

    /**
     * Validate phone number format
     */
    validatePhoneNumber(phone: string): boolean {
        // E.164 format: +[country code][number]
        const e164Regex = /^\+[1-9]\d{1,14}$/;
        return e164Regex.test(phone);
    }
}





