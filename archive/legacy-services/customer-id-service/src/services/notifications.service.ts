import { PrismaClient } from '@prisma/client'

export class NotificationsService {
  private prisma = new PrismaClient()

  async getNotificationPreferences(customerId: string) {
    const preferences = await this.prisma.notificationPreference.findUnique({
      where: { customerId }
    })

    if (!preferences) {
      return {
        emailOffers: true,
        emailOrders: true,
        emailNewsletter: false,
        smsOffers: true,
        smsOrders: true,
        pushNotifications: true,
        frequency: 'daily'
      }
    }

    return preferences
  }

  async updateNotificationPreferences(customerId: string, preferences: any) {
    const updated = await this.prisma.notificationPreference.upsert({
      where: { customerId },
      update: preferences,
      create: {
        customerId,
        ...preferences
      }
    })

    return updated
  }

  async getNotificationHistory(customerId: string, limit: number = 20) {
    const notifications = await this.prisma.notification.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      date: n.createdAt,
      status: 'مرسل',
      read: n.read
    }))
  }

  async sendNotification(customerId: string, type: string, message: string) {
    const notification = await this.prisma.notification.create({
      data: {
        customerId,
        type,
        title: this.getTitleByType(type),
        message,
        read: false
      }
    })

    return {
      id: notification.id,
      customerId,
      type,
      message,
      sentAt: notification.createdAt,
      status: 'sent'
    }
  }

  private getTitleByType(type: string): string {
    const titles: { [key: string]: string } = {
      'email': 'بريد إلكتروني',
      'sms': 'رسالة نصية',
      'push': 'إشعار',
      'offer': 'عرض خاص',
      'order': 'تحديث الطلب',
      'loyalty': 'نقاط الولاء'
    }
    return titles[type] || 'إشعار'
  }
}
