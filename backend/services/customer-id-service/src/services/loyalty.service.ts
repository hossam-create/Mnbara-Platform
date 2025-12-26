import { PrismaClient } from '@prisma/client'

export class LoyaltyService {
  private prisma = new PrismaClient()

  async getLoyaltyInfo(customerId: string) {
    const loyalty = await this.prisma.loyalty.findUnique({
      where: { customerId },
      include: { pointsHistory: true }
    })

    if (!loyalty) {
      return {
        customerId,
        points: 0,
        tier: 'bronze',
        joinDate: new Date(),
        totalSpent: 0
      }
    }

    return loyalty
  }

  async getTiers() {
    return [
      {
        name: 'Bronze',
        icon: '🥉',
        minPoints: 0,
        maxPoints: 1000,
        benefits: ['5% خصم', 'دعم أولي'],
        discount: 5
      },
      {
        name: 'Silver',
        icon: '🥈',
        minPoints: 1001,
        maxPoints: 5000,
        benefits: ['10% خصم', 'دعم أولوي', 'شحن مجاني'],
        discount: 10
      },
      {
        name: 'Gold',
        icon: '🥇',
        minPoints: 5001,
        maxPoints: 10000,
        benefits: ['15% خصم', 'دعم VIP', 'عروض حصرية'],
        discount: 15
      },
      {
        name: 'Platinum',
        icon: '💎',
        minPoints: 10001,
        maxPoints: 999999,
        benefits: ['20% خصم', 'مدير حساب', 'أولوية مطلقة'],
        discount: 20
      }
    ]
  }

  async addPoints(customerId: string, points: number, reason: string) {
    const loyalty = await this.prisma.loyalty.upsert({
      where: { customerId },
      update: {
        points: { increment: points },
        pointsHistory: {
          create: {
            points,
            reason,
            type: 'earned'
          }
        }
      },
      create: {
        customerId,
        points,
        tier: 'bronze',
        pointsHistory: {
          create: {
            points,
            reason,
            type: 'earned'
          }
        }
      }
    })

    return loyalty
  }

  async redeemPoints(customerId: string, points: number, rewardId: string) {
    const loyalty = await this.prisma.loyalty.update({
      where: { customerId },
      data: {
        points: { decrement: points },
        pointsHistory: {
          create: {
            points: -points,
            reason: `Redeemed reward: ${rewardId}`,
            type: 'redeemed'
          }
        }
      }
    })

    return loyalty
  }

  async getTierBenefits(tier: string) {
    const tiers = await this.getTiers()
    const tierData = tiers.find(t => t.name.toLowerCase() === tier.toLowerCase())
    return tierData?.benefits || []
  }

  async getHowToEarn() {
    return [
      {
        icon: '🛍️',
        title: 'التسوق',
        description: 'نقطة واحدة لكل ريال',
        points: 1
      },
      {
        icon: '👥',
        title: 'الإحالات',
        description: '100 نقطة لكل عميل جديد',
        points: 100
      },
      {
        icon: '⭐',
        title: 'التقييمات',
        description: '50 نقطة لكل تقييم',
        points: 50
      },
      {
        icon: '🎂',
        title: 'عيد الميلاد',
        description: '500 نقطة في عيد ميلادك',
        points: 500
      }
    ]
  }
}
