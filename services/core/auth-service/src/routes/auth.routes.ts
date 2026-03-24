import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const controller = new AuthController();

// Public routes
router.post('/register', controller.register.bind(controller));
router.post('/login', controller.login.bind(controller));

// Protected routes (would require auth middleware in production)
router.get('/profile', controller.getProfile.bind(controller));
router.put('/profile', controller.updateProfile.bind(controller));
router.post('/logout', controller.logout.bind(controller));

export default router;
