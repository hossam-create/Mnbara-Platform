import { Request, Response } from 'express';
import { locationNotificationService } from '../services/location-notification.service';

export const locationNotificationController = {
  /**
   * التحقق من موقع المستخدم وإرسال إشعارات
   * Check user location and send notifications
   */
  async checkLocation(req: Request, res: Response) {
    try {
      const { userId, lat, lon } = req.body;

      if (!userId || lat === undefined || lon === undefined) {
        return res.status(400).json({
          success: false,
          message: 'userId, lat, and lon are required',
          messageAr: 'معرف المستخدم وخط العرض وخط الطول مطلوبة'
        });
      }

      const notifications = await locationNotificationService.checkLocationAndNotify(
        userId,
        parseFloat(lat),
        parseFloat(lon)
      );

      return res.json({
        success: true,
        data: {
          notifications,
          count: notifications.length
        }
      });
    } catch (error) {
      console.error('Error checking location:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check location',
        messageAr: 'فشل في التحقق من الموقع'
      });
    }
  },

  /**
   * البحث عن مكاتب التحويل القريبة
   * Find nearby transfer offices
   */
  async findNearby(req: Request, res: Response) {
    try {
      const { lat, lon, radius } = req.query;

      if (lat === undefined || lon === undefined) {
        return res.status(400).json({
          success: false,
          message: 'lat and lon are required',
          messageAr: 'خط العرض وخط الطول مطلوبان'
        });
      }

      const nearbyLocations = await locationNotificationService.findNearbyWesternUnion(
        parseFloat(lat as string),
        parseFloat(lon as string),
        radius ? parseFloat(radius as string) : 2
      );

      return res.json({
        success: true,
        data: {
          locations: nearbyLocations,
          count: nearbyLocations.length,
          searchRadius: radius || 2
        }
      });
    } catch (error) {
      console.error('Error finding nearby locations:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to find nearby locations',
        messageAr: 'فشل في البحث عن المواقع القريبة'
      });
    }
  },

  /**
   * مقارنة الأسعار مع المنافسين
   * Compare prices with competitors
   */
  async comparePrices(req: Request, res: Response) {
    try {
      const { fromCurrency, toCurrency, amount } = req.body;

      if (!fromCurrency || !toCurrency || !amount) {
        return res.status(400).json({
          success: false,
          message: 'fromCurrency, toCurrency, and amount are required',
          messageAr: 'العملة المصدر والعملة الهدف والمبلغ مطلوبة'
        });
      }

      const comparison = await locationNotificationService.getPriceComparison(
        fromCurrency,
        toCurrency,
        parseFloat(amount)
      );

      return res.json({
        success: true,
        data: {
          comparison,
          message: `Save ${comparison.savingsPercent.toFixed(1)}% with Mnbara!`,
          messageAr: `وفر ${comparison.savingsPercent.toFixed(1)}% مع منبرة!`
        }
      });
    } catch (error) {
      console.error('Error comparing prices:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to compare prices',
        messageAr: 'فشل في مقارنة الأسعار'
      });
    }
  },

  /**
   * إنشاء إشعار بديل للمستخدم
   * Generate alternative notification for user
   */
  async generateAlternative(req: Request, res: Response) {
    try {
      const { userId, lat, lon, fromCurrency, toCurrency, amount } = req.body;

      if (!userId || lat === undefined || lon === undefined) {
        return res.status(400).json({
          success: false,
          message: 'userId, lat, and lon are required',
          messageAr: 'معرف المستخدم وخط العرض وخط الطول مطلوبة'
        });
      }

      const notification = await locationNotificationService.generateAlternativeNotification(
        userId,
        parseFloat(lat),
        parseFloat(lon),
        fromCurrency || 'USD',
        toCurrency || 'EGP',
        amount ? parseFloat(amount) : 100
      );

      if (!notification) {
        return res.json({
          success: true,
          data: null,
          message: 'No nearby Western Union offices found',
          messageAr: 'لم يتم العثور على مكاتب ويسترن يونيون قريبة'
        });
      }

      return res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('Error generating alternative:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate alternative',
        messageAr: 'فشل في إنشاء البديل'
      });
    }
  }
};
