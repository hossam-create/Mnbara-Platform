import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const authController = new AuthController();

// Register
router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Valid email required'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        body('firstName').notEmpty().withMessage('First name required'),
        body('lastName').notEmpty().withMessage('Last name required'),
    ],
    validateRequest,
    authController.register
);

// Login
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Valid email required'),
        body('password').notEmpty().withMessage('Password required'),
    ],
    validateRequest,
    authController.login
);

// Social OAuth routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);
router.get('/apple', authController.appleAuth);
router.get('/apple/callback', authController.appleCallback);

// Token refresh
router.post('/refresh', authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

// Get current user
router.get('/me', authController.getCurrentUser);

export default router;
