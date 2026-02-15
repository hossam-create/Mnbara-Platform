import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';

const router = Router();
const controller = new LocationController();

// Update user location
router.post('/update', (req, res) => controller.updateLocation(req, res));

// Get user location
router.get('/users/:userId', (req, res) => controller.getUserLocation(req, res));

// Find nearby users
router.get('/nearby', (req, res) => controller.findNearby(req, res));

// Calculate distance
router.get('/distance', (req, res) => controller.calculateDistance(req, res));

// Check geofence
router.get('/geofence/check', (req, res) => controller.checkGeofence(req, res));

// Get all geofences
router.get('/geofences', (req, res) => controller.getGeofences(req, res));

// Deactivate location
router.delete('/users/:userId', (req, res) => controller.deactivateLocation(req, res));

export default router;
