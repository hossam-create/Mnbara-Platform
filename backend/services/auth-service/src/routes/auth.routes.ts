import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();
const controller = new AuthController();

// Email/Password authentication
router.post('/register', controller.register.bind(controller));
router.post('/login', controller.login.bind(controller));
router.post('/refresh', controller.refresh.bind(controller));
router.post('/logout', controller.logout.bind(controller));

// Get current user
router.get('/me', authenticateJWT, controller.me.bind(controller));

// Google OAuth
router.get('/google', passport.authenticate('google', { session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/error' }),
  controller.oauthCallback.bind(controller)
);

// Facebook OAuth
router.get('/facebook', passport.authenticate('facebook', { session: false }));
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/auth/error' }),
  controller.oauthCallback.bind(controller)
);

// Apple OAuth
router.get('/apple', passport.authenticate('apple', { session: false }));
router.get(
  '/apple/callback',
  passport.authenticate('apple', { session: false, failureRedirect: '/auth/error' }),
  controller.oauthCallback.bind(controller)
);

export default router;
