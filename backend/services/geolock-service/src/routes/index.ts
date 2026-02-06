// GeoLock Routes
// مسارات GeoLock

import { Router } from 'express';
import { geoLockController } from '../controllers/geolock.controller';
import { geofencingController } from '../controllers/geofencing.controller';
import { locationAlertsController } from '../controllers/location-alerts.controller';

const router = Router();

// ==========================================
// 🌍 GeoLock Routes - تأمين جغرافي
// ==========================================

// Check access based on GeoLock rules
router.post('/check-access', (req, res) => geoLockController.checkAccess(req, res));

// Detect location from IP
router.post('/detect-location', (req, res) => geoLockController.detectLocation(req, res));

// Fuse IP and GPS location
router.post('/fuse-location', (req, res) => geoLockController.fuseLocation(req, res));

// GeoLock Rules CRUD
router.get('/rules', (req, res) => geoLockController.listRules(req, res));
router.post('/rules', (req, res) => geoLockController.createRule(req, res));
router.put('/rules/:id', (req, res) => geoLockController.updateRule(req, res));
router.delete('/rules/:id', (req, res) => geoLockController.deleteRule(req, res));

// ==========================================
// 🏢 Geofencing Routes - تحديد المناطق
// ==========================================

// Check location against geofence zones
router.post('/geofence/check', (req, res) => geofencingController.checkLocation(req, res));

// Geofence Zones CRUD
router.get('/zones', (req, res) => geofencingController.listZones(req, res));
router.get('/zones/airport/:airportCode', (req, res) => geofencingController.getZonesByAirport(req, res));
router.post('/zones', (req, res) => geofencingController.createZone(req, res));
router.put('/zones/:id', (req, res) => geofencingController.updateZone(req, res));
router.delete('/zones/:id', (req, res) => geofencingController.deleteZone(req, res));

// ==========================================
// ✈️ Location Alerts Routes - تنبيهات الموقع
// ==========================================

// Check alerts for a location
router.post('/alerts/check', (req, res) => locationAlertsController.checkAlerts(req, res));

// Get alerts near location
router.get('/alerts/nearby', (req, res) => locationAlertsController.getAlertsNearLocation(req, res));
router.get('/alerts/airport/:airportCode', (req, res) => locationAlertsController.getAlertsByAirport(req, res));

// Location Alerts CRUD
router.get('/alerts', (req, res) => locationAlertsController.listAlerts(req, res));
router.post('/alerts', (req, res) => locationAlertsController.createAlert(req, res));
router.put('/alerts/:id', (req, res) => locationAlertsController.updateAlert(req, res));
router.delete('/alerts/:id', (req, res) => locationAlertsController.deleteAlert(req, res));

// User Notifications
router.get('/notifications/:userId', (req, res) => locationAlertsController.getUserNotifications(req, res));
router.put('/notifications/:id/read', (req, res) => locationAlertsController.markNotificationRead(req, res));

export default router;
