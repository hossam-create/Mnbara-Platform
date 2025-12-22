import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { PhoneVerificationService } from '../services/phone-verification.service';

const phoneVerificationService = new PhoneVerificationService();

/**
 * Middleware to require verified phone number for sensitive actions
 */
export async function requireVerifiedPhone(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }

        const isVerified = await phoneVerificationService.isPhoneVerified(req.user.id);

        if (!isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Phone number verification required for this action',
                requiresPhoneVerification: true,
            });
        }

        next();
    } catch (error: any) {
        console.error('Phone verification middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
}





