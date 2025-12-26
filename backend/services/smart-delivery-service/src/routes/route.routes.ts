// Route Optimization Routes
// مسارات تحسين المسارات

import { Router } from 'express';
import { routeOptimizerService } from '../services/route-optimizer.service';

const router = Router();

// Optimize single route
router.post('/optimize', async (req, res) => {
  try {
    const { startLocation, waypoints, endLocation } = req.body;
    
    if (!startLocation || !waypoints) {
      return res.status(400).json({
        success: false,
        message: 'Start location and waypoints are required',
        messageAr: 'موقع البداية ونقاط الطريق مطلوبة'
      });
    }
    
    const optimizedRoute = await routeOptimizerService.optimizeRoute(
      startLocation,
      waypoints,
      endLocation
    );
    
    res.json({
      success: true,
      message: 'Route optimized',
      messageAr: 'تم تحسين المسار',
      data: optimizedRoute
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Optimize multiple deliveries
router.post('/optimize-deliveries', async (req, res) => {
  try {
    const { travelerId, deliveryIds } = req.body;
    
    if (!travelerId || !deliveryIds || deliveryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Traveler ID and delivery IDs are required',
        messageAr: 'معرف المسافر ومعرفات التوصيل مطلوبة'
      });
    }
    
    const result = await routeOptimizerService.optimizeMultipleDeliveries(
      travelerId,
      deliveryIds
    );
    
    res.json({
      success: true,
      message: 'Deliveries optimized',
      messageAr: 'تم تحسين التوصيلات',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Save route
router.post('/save', async (req, res) => {
  try {
    const { travelerId, route, date } = req.body;
    
    const savedRoute = await routeOptimizerService.saveRoute(
      travelerId,
      route,
      new Date(date)
    );
    
    res.status(201).json({
      success: true,
      message: 'Route saved',
      messageAr: 'تم حفظ المسار',
      data: savedRoute
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get route savings stats
router.get('/savings', async (req, res) => {
  try {
    const { travelerId } = req.query;
    const stats = await routeOptimizerService.getRouteSavingsStats(travelerId as string);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
