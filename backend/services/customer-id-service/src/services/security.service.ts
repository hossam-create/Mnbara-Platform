import { PrismaClient } from '@prisma/client'

export class SecurityService {
  private prisma = new PrismaClient()

  async getSecurityStatus(customerId: string) {
    const security = await this.prisma.securityProfile.findUnique({
      where: { customerId },
      include: { fraudAlerts: { take: 5, orderBy: { createdAt: 'desc' } } }
    })

    if (!security) {
      return {
        customerId,
        overallRisk: 'low',
        twoFactorEnabled: false,
        lastLogin: null,
        suspiciousActivities: 0,
        recentAlerts: []
      }
    }

    return {
      customerId,
      overallRisk: security.riskLevel,
      twoFactorEnabled: security.twoFactorEnabled,
      lastLogin: security.lastLoginAt,
      suspiciousActivities: security.suspiciousActivityCount,
      recentAlerts: security.fraudAlerts.map(alert => ({
        id: alert.id,
        type: alert.alertType,
        severity: alert.severity,
        description: alert.description,
        createdAt: alert.createdAt
      }))
    }
  }

  async getFraudAlerts(customerId: string) {
    const alerts = await this.prisma.fraudAlert.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return alerts.map(alert => ({
      id: alert.id,
      type: alert.alertType,
      severity: alert.severity,
      title: this.getAlertTitle(alert.alertType),
      description: alert.description,
      timestamp: alert.createdAt,
      resolved: alert.resolved,
      action: this.getRecommendedAction(alert.alertType)
    }))
  }

  async reportSuspiciousActivity(
    customerId: string,
    activityType: string,
    description: string,
    evidence?: string
  ) {
    const report = await this.prisma.suspiciousActivityReport.create({
      data: {
        customerId,
        activityType,
        description,
        evidence,
        status: 'pending'
      }
    })

    // Update security profile
    await this.prisma.securityProfile.update({
      where: { customerId },
      data: {
        suspiciousActivityCount: { increment: 1 }
      }
    })

    return {
      success: true,
      message: 'تم تسجيل التقرير بنجاح',
      reportId: report.id,
      status: 'تحت المراجعة'
    }
  }

  async getSecurityRecommendations(customerId: string) {
    const security = await this.prisma.securityProfile.findUnique({
      where: { customerId }
    })

    const recommendations = []

    if (!security?.twoFactorEnabled) {
      recommendations.push({
        priority: 'high',
        title: 'تفعيل المصادقة الثنائية',
        description: 'حماية حسابك بطبقة أمان إضافية',
        action: 'enable-2fa',
        icon: '🔐'
      })
    }

    if (security?.riskLevel === 'high') {
      recommendations.push({
        priority: 'critical',
        title: 'تغيير كلمة المرور',
        description: 'تم اكتشاف نشاط مريب - يرجى تغيير كلمة المرور فوراً',
        action: 'change-password',
        icon: '⚠️'
      })
    }

    recommendations.push({
      priority: 'medium',
      title: 'مراجعة الأجهزة المتصلة',
      description: 'تحقق من الأجهزة التي تدخل من خلالها',
      action: 'review-devices',
      icon: '📱'
    })

    recommendations.push({
      priority: 'low',
      title: 'تحديث معلومات الاتصال',
      description: 'تأكد من أن بيانات الاتصال محدثة',
      action: 'update-contact',
      icon: '📧'
    })

    return recommendations
  }

  async enableTwoFactor(customerId: string) {
    const security = await this.prisma.securityProfile.update({
      where: { customerId },
      data: {
        twoFactorEnabled: true,
        twoFactorEnabledAt: new Date()
      }
    })

    return {
      success: true,
      message: 'تم تفعيل المصادقة الثنائية',
      twoFactorEnabled: security.twoFactorEnabled
    }
  }

  async getSecurityHistory(customerId: string) {
    const history = await this.prisma.securityEvent.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 30
    })

    return history.map(event => ({
      id: event.id,
      type: event.eventType,
      title: this.getEventTitle(event.eventType),
      description: event.description,
      ipAddress: event.ipAddress,
      deviceInfo: event.deviceInfo,
      timestamp: event.createdAt,
      status: event.status
    }))
  }

  private getAlertTitle(alertType: string): string {
    const titles: { [key: string]: string } = {
      unusual_login: 'دخول غير معتاد',
      multiple_failed_attempts: 'محاولات دخول فاشلة متعددة',
      location_change: 'تغيير الموقع الجغرافي',
      new_device: 'جهاز جديد',
      suspicious_transaction: 'معاملة مريبة',
      account_access: 'محاولة وصول للحساب',
      data_access: 'محاولة وصول للبيانات'
    }
    return titles[alertType] || alertType
  }

  private getRecommendedAction(alertType: string): string {
    const actions: { [key: string]: string } = {
      unusual_login: 'تحقق من حسابك وغير كلمة المرور إذا لزم الأمر',
      multiple_failed_attempts: 'حسابك محمي - حاول مرة أخرى لاحقاً',
      location_change: 'تحقق من موقعك الحالي',
      new_device: 'أكد هذا الجهاز أو احظره',
      suspicious_transaction: 'راجع المعاملة وأبلغ عن أي نشاط غير مصرح',
      account_access: 'تحقق من نشاط حسابك',
      data_access: 'راجع أذونات الوصول'
    }
    return actions[alertType] || 'تحقق من حسابك'
  }

  private getEventTitle(eventType: string): string {
    const titles: { [key: string]: string } = {
      login: 'دخول',
      logout: 'خروج',
      password_change: 'تغيير كلمة المرور',
      profile_update: 'تحديث الملف الشخصي',
      payment: 'دفع',
      withdrawal: 'سحب',
      device_added: 'إضافة جهاز',
      device_removed: 'حذف جهاز'
    }
    return titles[eventType] || eventType
  }
}
