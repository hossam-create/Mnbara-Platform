// Analytics Routes
// مسارات التحليلات

import { Router } from 'express';
import { deliveryService } from '../services/delivery.service';
import { routeOptimizerService } from '../services/route-optimizer.service';
import { predictionService } from '../services/prediction.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get delivery stats
router.get('/deliveries', async (req, res) => {
  try {
    const { period } = req.query;
    const stats = await deliveryService.getDeliveryStats(
      (period as 'day' | 'week' | 'month') || 'week'
    );
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get route optimization stats
router.get('/routes', async (req, res) => {
  try {
    const { travelerId } = req.query;
    const stats = await routeOptimizerService.getRouteSavingsStats(travelerId as string);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get prediction accuracy
router.get('/predictions', async (req, res) => {
  try {
    const stats = await predictionService.getPredictionAccuracyStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get traveler performance
router.get('/travelers/:travelerId', async (req, res) => {
  try {
    const performance = await prisma.travelerPerformance.findUnique({
      where: { travelerId: req.params.travelerId }
    });
    
    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'Traveler not found',
        messageAr: 'المسافر غير موجود'
      });
    }
    
    res.json({ success: true, data: performance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get platform overview
router.get('/overview', async (req, res) => {
  try {
    const [deliveryStats, routeStats, predictionStats] = await Promise.all([
      deliveryService.getDeliveryStats('month'),
      routeOptimizerService.getRouteSavingsStats(),
      predictionService.getPredictionAccuracyStats()
    ]);
    
    res.json({
      success: true,
      data: {
        deliveries: deliveryStats,
        routes: routeStats,
        predictions: predictionStats
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
