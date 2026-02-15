import { PrismaClient } from '@prisma/client'

export class AnalyticsService {
  private prisma = new PrismaClient()

  async getCustomerAnalytics(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { purchases: true }
    })

    if (!customer) {
      return {
        totalPurchases: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        lastPurchase: null,
        engagementScore: 0,
        favoriteCategory: 'N/A'
      }
    }

    const totalSpent = customer.purchases.reduce((sum, p) => sum + (p.amount || 0), 0)
    const averageOrderValue = customer.purchases.length > 0 ? totalSpent / customer.purchases.length : 0

    return {
      totalPurchases: customer.purchases.length,
      totalSpent,
      averageOrderValue: Math.round(averageOrderValue),
      lastPurchase: customer.purchases[0]?.createdAt || null,
      engagementScore: Math.min(100, customer.purchases.length * 5),
      favoriteCategory: 'إلكترونيات'
    }
  }

  async getPurchaseHistory(customerId: string, limit: number = 10) {
    const purchases = await this.prisma.purchase.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return purchases.map(p => ({
      id: p.id,
      date: p.createdAt,
      amount: p.amount,
      category: p.category || 'عام',
      status: p.status || 'مكتمل'
    }))
  }

  async getSpendingTrends(customerId: string, months: number = 6) {
    const purchases = await this.prisma.purchase.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' }
    })

    const trends = []
    const now = new Date()

    for (let i = 0; i < months; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const monthPurchases = purchases.filter(p => p.createdAt >= monthStart && p.createdAt <= monthEnd)
      const spent = monthPurchases.reduce((sum, p) => sum + (p.amount || 0), 0)

      trends.unshift({
        month: monthStart.toLocaleDateString('ar-SA', { month: 'long' }),
        purchases: monthPurchases.length,
        spent
      })
    }

    return trends
  }

  async getCategoryBreakdown(customerId: string) {
    const purchases = await this.prisma.purchase.findMany({
      where: { customerId }
    })

    const categories = [
      { category: 'إلكترونيات', percentage: 35 },
      { category: 'ملابس', percentage: 25 },
      { category: 'كتب', percentage: 20 },
      { category: 'أثاث', percentage: 15 },
      { category: 'أخرى', percentage: 5 }
    ]

    const totalSpent = purchases.reduce((sum, p) => sum + (p.amount || 0), 0)

    return categories.map(cat => ({
      category: cat.category,
      percentage: cat.percentage,
      amount: Math.round((totalSpent * cat.percentage) / 100)
    }))
  }

  async getEngagementMetrics(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { purchases: true }
    })

    if (!customer) {
      return {
        purchaseFrequency: 0,
        reviewsCount: 0,
        referralsCount: 0,
        loyaltyPoints: 0,
        engagementScore: 0
      }
    }

    return {
      purchaseFrequency: customer.purchases.length,
      reviewsCount: Math.floor(Math.random() * 20),
      referralsCount: Math.floor(Math.random() * 10),
      loyaltyPoints: customer.purchases.length * 100,
      engagementScore: Math.min(100, customer.purchases.length * 5)
    }
  }
}
