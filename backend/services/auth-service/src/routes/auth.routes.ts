import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth.middleware';
import {
    checkPermission,
    adminOnly,
    selfOrAdmin,
} from '../middleware/permission.middleware';

const router = Router();
const authController = new AuthController();

// ============================================
// Public Routes (No Authentication Required)
// ============================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
    '/register',
    [
        body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain uppercase, lowercase, and number'),
        body('firstName').trim().notEmpty().withMessage('First name required'),
        body('lastName').trim().notEmpty().withMessage('Last name required'),
        body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
    ],
    validateRequest,
    authController.register.bind(authController)
);

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password (supports 2FA)
 * @access  Public
 */
router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
        body('password').notEmpty().withMessage('Password required'),
        body('twoFactorCode').optional().isString().withMessage('2FA code must be a string'),
    ],
    validateRequest,
    authController.login.bind(authController)
);

/**
 * @route   POST /api/auth/oauth
 * @desc    OAuth login (for mobile/frontend after OAuth flow)
 * @access  Public
 */
router.post(
    '/oauth',
    [
        body('provider').isIn(['google', 'apple']).withMessage('Invalid OAuth provider'),
        body('providerId').notEmpty().withMessage('Provider ID required'),
        body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
        body('firstName').trim().notEmpty().withMessage('First name required'),
        body('lastName').trim().notEmpty().withMessage('Last name required'),
        body('avatar').optional().isURL().withMessage('Invalid avatar URL'),
    ],
    validateRequest,
    authController.oauthLogin.bind(authController)
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
    '/refresh',
    [
        body('refreshToken').notEmpty().withMessage('Refresh token required'),
    ],
    validateRequest,
    authController.refreshToken.bind(authController)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (revoke refresh token)
 * @access  Public
 */
router.post(
    '/logout',
    [
        body('refreshToken').optional().isString(),
    ],
    authController.logout.bind(authController)
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post(
    '/forgot-password',
    [
        body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    ],
    validateRequest,
    authController.forgotPassword.bind(authController)
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
    '/reset-password',
    [
        body('token').notEmpty().withMessage('Reset token required'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain uppercase, lowercase, and number'),
    ],
    validateRequest,
    authController.resetPassword.bind(authController)
);

/**
 * @route   GET /api/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.get(
    '/verify-email',
    [
        query('token').notEmpty().withMessage('Verification token required'),
    ],
    validateRequest,
    authController.verifyEmail.bind(authController)
);

// ============================================
// OAuth Routes
// ============================================

/**
 * @route   GET /api/auth/google
 * @desc    Get Google OAuth URL
 * @access  Public
 */
router.get('/google', authController.googleAuth.bind(authController));

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', authController.googleCallback.bind(authController));

/**
 * @route   GET /api/auth/apple
 * @desc    Get Apple OAuth URL
 * @access  Public
 */
router.get('/apple', authController.appleAuth.bind(authController));

/**
 * @route   POST /api/auth/apple/callback
 * @desc    Handle Apple OAuth callback (Apple uses POST)
 * @access  Public
 */
router.post('/apple/callback', authController.appleCallback.bind(authController));

// ============================================
// Protected Routes (Authentication Required)
// ============================================

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser.bind(authController));

/**
 * @route   PATCH /api/auth/me
 * @desc    Update current user profile
 * @access  Private
 */
router.patch(
    '/me',
    authenticate,
    [
        body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
        body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
        body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
        body('avatar').optional().isURL().withMessage('Invalid avatar URL'),
    ],
    validateRequest,
    authController.updateProfile.bind(authController)
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (requires current password and 2FA if enabled)
 * @access  Private
 */
router.post(
    '/change-password',
    authenticate,
    [
        body('currentPassword').notEmpty().withMessage('Current password required'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain uppercase, lowercase, and number'),
        body('twoFactorCode').optional().isString().withMessage('2FA code must be a string'),
    ],
    validateRequest,
    authController.changePassword.bind(authController)
);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all', authenticate, authController.logoutAll.bind(authController));

// ============================================
// Two-Factor Authentication (2FA) Routes
// ============================================

/**
 * @route   POST /api/auth/2fa/setup
 * @desc    Generate 2FA secret and QR code
 * @access  Private
 */
router.post(
    '/2fa/setup',
    authenticate,
    authController.setup2FA.bind(authController)
);

/**
 * @route   POST /api/auth/2fa/enable
 * @desc    Enable 2FA after verifying token
 * @access  Private
 */
router.post(
    '/2fa/enable',
    authenticate,
    [
        body('token').notEmpty().withMessage('2FA code is required'),
    ],
    validateRequest,
    authController.enable2FA.bind(authController)
);

/**
 * @route   POST /api/auth/2fa/disable
 * @desc    Disable 2FA (requires valid token)
 * @access  Private
 */
router.post(
    '/2fa/disable',
    authenticate,
    [
        body('token').notEmpty().withMessage('2FA code is required'),
    ],
    validateRequest,
    authController.disable2FA.bind(authController)
);

/**
 * @route   GET /api/auth/2fa/status
 * @desc    Get 2FA status for current user
 * @access  Private
 */
router.get(
    '/2fa/status',
    authenticate,
    authController.get2FAStatus.bind(authController)
);

/**
 * @route   POST /api/auth/2fa/regenerate-backup-codes
 * @desc    Regenerate backup recovery codes
 * @access  Private
 */
router.post(
    '/2fa/regenerate-backup-codes',
    authenticate,
    [
        body('token').notEmpty().withMessage('2FA code is required'),
    ],
    validateRequest,
    authController.regenerateBackupCodes.bind(authController)
);

// ============================================
// Phone Verification Routes
// ============================================

/**
 * @route   POST /api/auth/phone/add
 * @desc    Add phone number to account
 * @access  Private
 */
router.post(
    '/phone/add',
    authenticate,
    [
        body('phoneNumber')
            .notEmpty()
            .withMessage('Phone number is required')
            .matches(/^\+[1-9]\d{1,14}$/)
            .withMessage('Phone number must be in E.164 format (e.g., +1234567890)'),
    ],
    validateRequest,
    authController.addPhoneNumber.bind(authController)
);

/**
 * @route   POST /api/auth/phone/send-otp
 * @desc    Send OTP code to phone number
 * @access  Private
 */
router.post(
    '/phone/send-otp',
    authenticate,
    authController.sendOtp.bind(authController)
);

/**
 * @route   POST /api/auth/phone/verify
 * @desc    Verify OTP code
 * @access  Private
 */
router.post(
    '/phone/verify',
    authenticate,
    [
        body('otpCode')
            .notEmpty()
            .withMessage('OTP code is required')
            .isLength({ min: 6, max: 6 })
            .withMessage('OTP code must be 6 digits')
            .isNumeric()
            .withMessage('OTP code must be numeric'),
    ],
    validateRequest,
    authController.verifyOtp.bind(authController)
);

/**
 * @route   GET /api/auth/phone/status
 * @desc    Get phone verification status
 * @access  Private
 */
router.get(
    '/phone/status',
    authenticate,
    authController.getPhoneVerificationStatus.bind(authController)
);

/**
 * @route   DELETE /api/auth/phone
 * @desc    Remove phone number from account
 * @access  Private
 */
router.delete(
    '/phone',
    authenticate,
    authController.removePhoneNumber.bind(authController)
);

// ============================================
// Admin Routes (Admin Permission Required)
// ============================================

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (admin only)
 * @access  Admin
 */
router.get(
    '/users',
    authenticate,
    adminOnly,
    checkPermission('user', 'read'),
    authController.getAllUsers.bind(authController)
);

/**
 * @route   GET /api/auth/users/:userId
 * @desc    Get user by ID (self or admin)
 * @access  Private (self or admin)
 */
router.get(
    '/users/:userId',
    authenticate,
    [
        param('userId').isInt().withMessage('Valid user ID required'),
    ],
    validateRequest,
    selfOrAdmin('userId'),
    authController.getUserById.bind(authController)
);

/**
 * @route   PATCH /api/auth/users/:userId/status
 * @desc    Update user status (admin only)
 * @access  Admin
 */
router.patch(
    '/users/:userId/status',
    authenticate,
    adminOnly,
    checkPermission('user', 'update'),
    [
        param('userId').isInt().withMessage('Valid user ID required'),
        body('isActive').isBoolean().withMessage('isActive must be a boolean'),
    ],
    validateRequest,
    authController.updateUserStatus.bind(authController)
);

/**
 * @route   PATCH /api/auth/users/:userId/role
 * @desc    Update user role (admin only)
 * @access  Admin
 */
router.patch(
    '/users/:userId/role',
    authenticate,
    adminOnly,
    checkPermission('user', 'manage'),
    [
        param('userId').isInt().withMessage('Valid user ID required'),
        body('role').isIn(['USER', 'BUYER', 'SELLER', 'TRAVELER', 'ADMIN']).withMessage('Invalid role'),
    ],
    validateRequest,
    authController.updateUserRole.bind(authController)
);

/**
 * @route   DELETE /api/auth/users/:userId
 * @desc    Delete user (admin only)
 * @access  Admin
 */
router.delete(
    '/users/:userId',
    authenticate,
    adminOnly,
    checkPermission('user', 'delete'),
    [
        param('userId').isInt().withMessage('Valid user ID required'),
    ],
    validateRequest,
    authController.deleteUser.bind(authController)
);

export default router;
