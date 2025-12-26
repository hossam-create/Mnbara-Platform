// Prediction Routes
// مسارات التنبؤ

import { Router } from 'express';
import { predictionService } from '../services/prediction.service';

const router = Router();

// Predict delivery time
router.post('/delivery-time', async (req, res) => {
  try {
    const { pickupLocation, dropoffLocation, travelerId } = req.body;
    
    if (!pickupLocation || !dropoffLocation) {
      return res.status(400).json({
        success: false,
        message: 'Pickup and dropoff locations are required',
        messageAr: 'موقع الاستلام والتسليم مطلوبان'
      });
    }
    
    const prediction = await predictionService.predictDeliveryTime(
      pickupLocation,
      dropoffLocation,
      travelerId
    );
    
    res.json({
      success: true,
      data: prediction
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get prediction accuracy stats
router.get('/accuracy', async (req, res) => {
  try {
    const stats = await predictionService.getPredictionAccuracyStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
