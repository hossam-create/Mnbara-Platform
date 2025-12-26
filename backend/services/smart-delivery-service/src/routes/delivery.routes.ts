// Delivery Routes
// مسارات التوصيل

import { Router } from 'express';
import { deliveryService } from '../services/delivery.service';

const router = Router();

// Create delivery
router.post('/', async (req, res) => {
  try {
    const delivery = await deliveryService.createDelivery(req.body);
    res.status(201).json({
      success: true,
      message: 'Delivery created',
      messageAr: 'تم إنشاء التوصيل',
      data: delivery
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get delivery by ID
router.get('/:id', async (req, res) => {
  try {
    const delivery = await deliveryService.getDeliveryById(req.params.id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
        messageAr: 'التوصيل غير موجود'
      });
    }
    res.json({ success: true, data: delivery });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// List deliveries
router.get('/', async (req, res) => {
  try {
    const { travelerId, status, fromDate, toDate, page, limit } = req.query;
    const result = await deliveryService.listDeliveries(
      {
        travelerId: travelerId as string,
        status: status as any,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined
      },
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Assign traveler
router.post('/:id/assign', async (req, res) => {
  try {
    const { travelerId } = req.body;
    const delivery = await deliveryService.assignTraveler(req.params.id, travelerId);
    res.json({
      success: true,
      message: 'Traveler assigned',
      messageAr: 'تم تعيين المسافر',
      data: delivery
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, location } = req.body;
    const delivery = await deliveryService.updateStatus(req.params.id, status, location);
    
    // Emit via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`delivery:${req.params.id}`).emit('status_update', {
        deliveryId: req.params.id,
        status,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Status updated',
      messageAr: 'تم تحديث الحالة',
      data: delivery
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update location
router.put('/:id/location', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const delivery = await deliveryService.updateLocation(req.params.id, { lat, lng });
    
    // Emit via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`delivery:${req.params.id}`).emit('traveler_location', {
        deliveryId: req.params.id,
        location: { lat, lng },
        timestamp: new Date()
      });
    }
    
    res.json({ success: true, data: delivery });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Rate delivery
router.post('/:id/rate', async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const delivery = await prisma.delivery.update({
      where: { id: req.params.id },
      data: { rating, feedback }
    });
    
    // Update traveler performance
    if (delivery.travelerId) {
      await deliveryService.updateTravelerPerformance(delivery.travelerId);
    }
    
    res.json({
      success: true,
      message: 'Rating submitted',
      messageAr: 'تم إرسال التقييم',
      data: delivery
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
