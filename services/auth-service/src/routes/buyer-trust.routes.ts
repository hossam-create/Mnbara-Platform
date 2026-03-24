/**
 * Buyer Trust Verification Routes
 *
 * Purpose: Fraud prevention, dispute resolution, buyer accountability
 * NOT financial verification
 *
 * Access Rules:
 * - Unverified buyers CAN browse
 * - Verified required to submit purchase requests
 */

import { Router, Request, Response, NextFunction } from 'express';
import { buyerTrustService } from '../services/buyer-trust.service';
import { authenticate } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import {
  CreateBuyerProfileRequest,
  UpdateBuyerProfileRequest,
  AddAddressRequest,
  SendBuyerOtpRequest,
  VerifyBuyerOtpRequest,
  ApplyRestrictionRequest,
} from '../types/buyer-trust.types';

const router = Router();

// ============================================
// MIDDLEWARE: Extract client info
// ============================================
function extractClientInfo(req: Request) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'],
    deviceFingerprint: req.headers['x-device-fingerprint'] as string | undefined,
  };
}

// ============================================
// USER ROUTES (Authenticated)
// ============================================

/**
 * Create or get buyer profile
 * POST /api/buyer-trust/profile
 */
router.post('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const clientInfo = extractClientInfo(req);

    const data: CreateBuyerProfileRequest = {
      email: (req as any).user.email,
      fullName: req.body.fullName,
      ipAddress: clientInfo.ipAddress,
      deviceFingerprint: clientInfo.deviceFingerprint,
      userAgent: clientInfo.userAgent,
    };

    const profile = await buyerTrustService.createProfile(userId, data);
    const response = await buyerTrustService.getProfileResponse(userId);
    res.status(201).json({ data: response });
  } catch (error: any) {
    if (error.message.includes('not found')) {
      next(error);
    } else {
      // Profile exists, return it
      try {
        const userId = (req as any).user.id;
        const response = await buyerTrustService.getProfileResponse(userId);
        res.json({ data: response });
      } catch {
        next(error);
      }
    }
  }
});

/**
 * Get current profile
 * GET /api/buyer-trust/profile
 */
router.get('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const response = await buyerTrustService.getProfileResponse(userId);
    res.json({ data: response });
  } catch (error: any) {
    if (error.message === 'Buyer profile not found') {
      res.status(404).json({
        error: { message: 'No buyer profile found. Please create one first.' },
      });
    } else {
      next(error);
    }
  }
});

/**
 * Update profile
 * PATCH /api/buyer-trust/profile
 */
router.patch('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const clientInfo = extractClientInfo(req);
    const data: UpdateBuyerProfileRequest = req.body;

    await buyerTrustService.updateProfile(userId, data, clientInfo.ipAddress);
    const response = await buyerTrustService.getProfileResponse(userId);
    res.json({ data: response });
  } catch (error) {
    next(error);
  }
});

/**
 * Check buyer access status
 * GET /api/buyer-trust/status
 */
router.get('/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const status = await buyerTrustService.checkBuyerAccess(userId);
    res.json({ data: status });
  } catch (error) {
    next(error);
  }
});

/**
 * Get trust indicator (read-only)
 * GET /api/buyer-trust/indicator
 */
router.get('/indicator', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const indicator = await buyerTrustService.getTrustIndicator(userId);
    res.json({ data: indicator });
  } catch (error) {
    next(error);
  }
});

// ============================================
// ADDRESS ROUTES
// ============================================

/**
 * Add delivery address
 * POST /api/buyer-trust/addresses
 */
router.post('/addresses', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const clientInfo = extractClientInfo(req);
    const data: AddAddressRequest = req.body;

    const address = await buyerTrustService.addAddress(userId, data, clientInfo.ipAddress);
    res.status(201).json({ data: address, message: 'Address added successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * Update address
 * PATCH /api/buyer-trust/addresses/:addressId
 */
router.patch(
  '/addresses/:addressId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const addressId = parseInt(req.params.addressId);
      const clientInfo = extractClientInfo(req);
      const data: Partial<AddAddressRequest> = req.body;

      const address = await buyerTrustService.updateAddress(
        userId,
        addressId,
        data,
        clientInfo.ipAddress
      );
      res.json({ data: address, message: 'Address updated successfully' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Delete address
 * DELETE /api/buyer-trust/addresses/:addressId
 */
router.delete(
  '/addresses/:addressId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const addressId = parseInt(req.params.addressId);

      await buyerTrustService.deleteAddress(userId, addressId);
      res.json({ message: 'Address deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Validate address (basic format check)
 * POST /api/buyer-trust/addresses/:addressId/validate
 */
router.post(
  '/addresses/:addressId/validate',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const addressId = parseInt(req.params.addressId);

      const address = await buyerTrustService.validateAddress(userId, addressId);
      res.json({ data: address, message: 'Address validated successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// PHONE VERIFICATION ROUTES
// ============================================

/**
 * Send OTP to phone
 * POST /api/buyer-trust/phone/send-otp
 */
router.post(
  '/phone/send-otp',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const data: SendBuyerOtpRequest = req.body;

      if (!data.phoneNumber || !data.countryCode) {
        return res.status(400).json({
          error: { message: 'phoneNumber and countryCode are required' },
        });
      }

      const result = await buyerTrustService.sendPhoneOtp(userId, data);
      res.json({ data: result, message: 'OTP sent successfully' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Verify phone OTP
 * POST /api/buyer-trust/phone/verify-otp
 */
router.post(
  '/phone/verify-otp',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const clientInfo = extractClientInfo(req);
      const { phoneNumber, otp } = req.body;

      if (!phoneNumber || !otp) {
        return res.status(400).json({
          error: { message: 'phoneNumber and otp are required' },
        });
      }

      const data: VerifyBuyerOtpRequest = {
        phoneNumber,
        otp,
        ipAddress: clientInfo.ipAddress,
      };

      const result = await buyerTrustService.verifyPhoneOtp(userId, data);
      res.json({ data: result, message: 'Phone verified successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * Apply restriction to buyer
 * POST /api/buyer-trust/admin/:userId/restrict
 */
router.post(
  '/admin/:userId/restrict',
  authenticate,
  checkPermission('user', 'manage'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetUserId = parseInt(req.params.userId);
      const adminId = (req as any).user.id;
      const clientInfo = extractClientInfo(req);
      const data: ApplyRestrictionRequest = req.body;

      if (!data.reason) {
        return res.status(400).json({
          error: { message: 'Restriction reason is required' },
        });
      }

      const profile = await buyerTrustService.applyRestriction(
        targetUserId,
        adminId,
        data,
        clientInfo.ipAddress
      );

      res.json({ data: profile, message: 'Restriction applied' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Lift restriction from buyer
 * POST /api/buyer-trust/admin/:userId/unrestrict
 */
router.post(
  '/admin/:userId/unrestrict',
  authenticate,
  checkPermission('user', 'manage'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetUserId = parseInt(req.params.userId);
      const adminId = (req as any).user.id;
      const clientInfo = extractClientInfo(req);
      const { notes } = req.body;

      const profile = await buyerTrustService.liftRestriction(
        targetUserId,
        adminId,
        notes,
        clientInfo.ipAddress
      );

      res.json({ data: profile, message: 'Restriction lifted' });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// ERROR HANDLER
// ============================================
router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Buyer Trust Error:', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    error: {
      message,
      code: error.code || 'BUYER_TRUST_ERROR',
    },
  });
});

export default router;
