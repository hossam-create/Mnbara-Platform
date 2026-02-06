// Location Alerts Service
// خدمة تنبيهات الموقع الذكية

import { PrismaClient, LocationAlert as LocationAlertModel, AlertNotification } from '@prisma/client';
import { 
  LocationAlertData, 
  AlertTriggerResult, 
  AlertNotificationData,
  AlertAction,
  Coordinates 
} from '../types';
import { getDistance } from 'geolib';
import { logger } from '../utils/logger';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Cache keys
const ALERT_CACHE_PREFIX = 'alert:';
const ALERT_USER_PREFIX = 'alert:user:';
const ALERT_COOLDOWN_PREFIX = 'alert:cooldown:';

export class LocationAlertsService {
  /**
   * Check if any alerts should be triggered for a location
   */
  async checkAlerts(
    userId: string,
    latitude: number,
    longitude: number
  ): Promise<AlertTriggerResult[]> {
    try {
      const triggeredAlerts: AlertTriggerResult[] = [];
      
      // Get active alerts
      const alerts = await this.getActiveAlerts();
      
      for (const alert of alerts) {
        // Check if user is in scope
        if (!this.isUserInScope(userId, alert)) continue;
        
        // Check if alert is valid (time restrictions)
        if (!this.isAlertValid(alert)) continue;
        
        // Calculate distance to target
        const distanceKm = this.calculateDistance(latitude, longitude, alert);
        
        // Check if within trigger range
        const shouldTrigger = this.shouldTriggerAlert(alert, distanceKm);
        
        if (shouldTrigger) {
          // Check cooldown
          const inCooldown = await this.checkCooldown(userId, alert.id);
          if (inCooldown) continue;
          
          // Create trigger result
          const result = await this.triggerAlert(userId, alert, latitude, longitude, distanceKm);
          triggeredAlerts.push(result);
        }
      }
      
      return triggeredAlerts;
    } catch (error) {
      logger.error('Alert check error:', error);
      return [];
    }
  }

  /**
   * Get active alerts
   */
  private async getActiveAlerts(): Promise<LocationAlertData[]> {
    try {
      const alerts = await prisma.locationAlert.findMany({
        where: {
          isActive: true
        }
      });
      
      return alerts.map(alert => ({
        id: alert.id,
        name: alert.name,
        alertType: alert.alertType,
        triggerType: alert.triggerType,
        triggerValue: alert.triggerValue,
        targetLatitude: alert.targetLatitude,
        targetLongitude: alert.targetLongitude,
        targetName: alert.targetName || undefined,
        targetCode: alert.targetCode || undefined,
        title: alert.title,
        titleAr: alert.titleAr,
        message: alert.message,
        messageAr: alert.messageAr,
        actions: alert.actions as AlertAction[] | undefined,
        isActive: alert.isActive,
        maxAlertsPerUser: alert.maxAlertsPerUser,
        cooldownMinutes: alert.cooldownMinutes
      }));
    } catch (error) {
      logger.error('Error fetching alerts:', error);
      return [];
    }
  }

  /**
   * Check if user is in scope for an alert
   */
  private isUserInScope(userId: string, alert: LocationAlertData): boolean {
    // Global alerts apply to all users
    if (alert.isGlobal) return true;
    
    // Check if user is in target list
    if (alert.userIds.length > 0) {
      return alert.userIds.includes(userId);
    }
    
    // Role-based targeting would need user service integration
    return true;
  }

  /**
   * Check if alert is currently valid (time restrictions)
   */
  private isAlertValid(alert: LocationAlertData): boolean {
    const now = new Date();
    
    // Check date range
    if (alert.validFrom && now < alert.validFrom) return false;
    if (alert.validUntil && now > alert.validUntil) return false;
    
    // Check day of week
    if (alert.daysOfWeek && alert.daysOfWeek.length > 0) {
      const currentDay = now.getDay();
      if (!alert.daysOfWeek.includes(currentDay)) return false;
    }
    
    // Check time of day
    if (alert.activeHours) {
      const activeHours = alert.activeHours as { start: string; end: string };
      if (activeHours.start && activeHours.end) {
        const currentTime = now.toTimeString().slice(0, 5);
        if (currentTime < activeHours.start || currentTime > activeHours.end) return false;
      }
    }
    
    return true;
  }

  /**
   * Calculate distance to alert target
   */
  private calculateDistance(
    lat: number, 
    lng: number, 
    alert: LocationAlertData
  ): number {
    const distanceMeters = getDistance(
      { latitude: lat, longitude: lng },
      { latitude: alert.targetLatitude, longitude: alert.targetLongitude }
    );
    return distanceMeters / 1000; // Convert to km
  }

  /**
   * Determine if alert should trigger
   */
  private shouldTriggerAlert(alert: LocationAlertData, distanceKm: number): boolean {
    switch (alert.triggerType) {
      case 'PROXIMITY':
        return distanceKm <= alert.triggerValue;
      case 'EXIT_PROXIMITY':
        // Trigger when exiting proximity radius
        // This would need previous state tracking
        return distanceKm > alert.triggerValue;
      case 'ENTER_PROXIMITY':
        // Trigger when entering proximity radius
        return distanceKm <= alert.triggerValue;
      default:
        return distanceKm <= alert.triggerValue;
    }
  }

  /**
   * Check if user is in cooldown period for an alert
   */
  private async checkCooldown(userId: string, alertId: string): Promise<boolean> {
    try {
      const key = `${ALERT_COOLDOWN_PREFIX}${userId}:${alertId}`;
      const inCooldown = await redis.exists(key);
      return inCooldown === 1;
    } catch (error) {
      logger.warn('Redis error checking cooldown:', error);
      return false;
    }
  }

  /**
   * Set cooldown for user on alert
   */
  private async setCooldown(userId: string, alertId: string, cooldownMinutes: number): Promise<void> {
    try {
      const key = `${ALERT_COOLDOWN_PREFIX}${userId}:${alertId}`;
      await redis.setex(key, cooldownMinutes * 60, '1');
    } catch (error) {
      logger.warn('Redis error setting cooldown:', error);
    }
  }

  /**
   * Trigger an alert and send notifications
   */
  private async triggerAlert(
    userId: string,
    alert: LocationAlertData,
    latitude: number,
    longitude: number,
    distanceKm: number
  ): Promise<AlertTriggerResult> {
    // Set cooldown
    await this.setCooldown(userId, alert.id, alert.cooldownMinutes);
    
    // Create notification data
    const notification: AlertNotificationData = {
      alertId: alert.id,
      userId,
      title: alert.title,
      titleAr: alert.titleAr,
      message: alert.message,
      messageAr: alert.messageAr,
      latitude,
      longitude,
      actions: alert.actions,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
    
    // Save notification to database
    await this.saveNotification(notification);
    
    // Update alert stats
    await prisma.locationAlert.update({
      where: { id: alert.id },
      data: {
        totalTriggered: { increment: 1 },
        lastTriggeredAt: new Date()
      }
    });
    
    // Trigger push notification (would use message queue in production)
    await this.sendPushNotification(notification);
    
    logger.info(`Alert triggered: ${alert.name} for user ${userId}, distance: ${distanceKm.toFixed(2)}km`);
    
    return {
      alertId: alert.id,
      triggered: true,
      userIds: [userId],
      notifications: [notification]
    };
  }

  /**
   * Save notification to database
   */
  private async saveNotification(notification: AlertNotificationData): Promise<void> {
    try {
      await prisma.alertNotification.create({
        data: {
          alertId: notification.alertId,
          userId: notification.userId,
          latitude: notification.latitude,
          longitude: notification.longitude,
          channel: 'push',
          status: 'PENDING'
        }
      });
    } catch (error) {
      logger.error('Error saving notification:', error);
    }
  }

  /**
   * Send push notification (placeholder)
   */
  private async sendPushNotification(notification: AlertNotificationData): Promise<void> {
    // In production, this would send to a push notification service
    // For now, log notification
    logger.info('Push notification:', {
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      data: notification.actions
    });
  }

  /**
   * Get alerts near a location
   */
  async getAlertsNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ): Promise<LocationAlertData[]> {
    try {
      const alerts = await this.getActiveAlerts();
      
      return alerts.filter(alert => {
        const distance = this.calculateDistance(latitude, longitude, alert);
        return distance <= radiusKm;
      }).sort((a, b) => {
        const distA = this.calculateDistance(latitude, longitude, a);
        const distB = this.calculateDistance(latitude, longitude, b);
        return distA - distB;
      });
    } catch (error) {
      logger.error('Error getting nearby alerts:', error);
      return [];
    }
  }

  /**
   * Get alerts for an airport
   */
  async getAlertsByAirport(airportCode: string): Promise<LocationAlertData[]> {
    try {
      const alerts = await prisma.locationAlert.findMany({
        where: {
          isActive: true,
          targetCode: airportCode.toUpperCase()
        }
      });
      
      return alerts.map(alert => ({
        id: alert.id,
        name: alert.name,
        alertType: alert.alertType,
        triggerType: alert.triggerType,
        triggerValue: alert.triggerValue,
        targetLatitude: alert.targetLatitude,
        targetLongitude: alert.targetLongitude,
        targetName: alert.targetName || undefined,
        targetCode: alert.targetCode || undefined,
        title: alert.title,
        titleAr: alert.titleAr,
        message: alert.message,
        messageAr: alert.messageAr,
        actions: alert.actions as AlertAction[] | undefined,
        isActive: alert.isActive,
        maxAlertsPerUser: alert.maxAlertsPerUser,
        cooldownMinutes: alert.cooldownMinutes
      }));
    } catch (error) {
      logger.error('Error getting airport alerts:', error);
      return [];
    }
  }

  /**
   * Create a new location alert
   */
  async createAlert(data: Partial<LocationAlertModel>): Promise<LocationAlertModel> {
    return await prisma.locationAlert.create({
      data: {
        name: data.name || 'New Alert',
        description: data.description,
        isActive: data.isActive ?? true,
        alertType: data.alertType || 'AIRPORT_PROXIMITY',
        triggerType: data.triggerType || 'PROXIMITY',
        triggerValue: data.triggerValue || 10, // 10km default
        targetLatitude: data.targetLatitude || 0,
        targetLongitude: data.targetLongitude || 0,
        targetName: data.targetName,
        targetCode: data.targetCode,
        title: data.title || 'Location Alert',
        titleAr: data.titleAr || 'تنبيه الموقع',
        message: data.message || 'You are near a location of interest',
        messageAr: data.messageAr || 'أنت بالقرب من موقع مثير للاهتمام',
        actions: data.actions,
        activeHours: data.activeHours,
        daysOfWeek: data.daysOfWeek,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        maxAlertsPerUser: data.maxAlertsPerUser || 3,
        cooldownMinutes: data.cooldownMinutes || 60
      }
    });
  }

  /**
   * Update a location alert
   */
  async updateAlert(id: string, data: Partial<LocationAlertModel>): Promise<LocationAlertModel> {
    return await prisma.locationAlert.update({
      where: { id },
      data
    });
  }

  /**
   * Delete a location alert
   */
  async deleteAlert(id: string): Promise<void> {
    await prisma.locationAlert.delete({ where: { id } });
  }

  /**
   * List all alerts
   */
  async listAlerts(activeOnly = false): Promise<LocationAlertModel[]> {
    return await prisma.locationAlert.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    await prisma.alertNotification.update({
      where: { id: notificationId },
      data: {
        status: 'READ',
        readAt: new Date()
      }
    });
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    limit = 50,
    unreadOnly = false
  ): Promise<AlertNotification[]> {
    return await prisma.alertNotification.findMany({
      where: {
        userId,
        ...(unreadOnly && { status: { not: 'READ' } })
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
}

export const locationAlertsService = new LocationAlertsService();
