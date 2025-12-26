import { PrismaClient } from '@prisma/client'

export class RewardsService {
  private prisma = new PrismaClient()

  async getSpecialDateRewards(customerId: string) {
    const rewards = await this.prisma.specialDateReward.findMany({
      where: { customerId },
      orderBy: { eventDate: 'asc' }
    })

    return rewards.map(reward => ({
      id: reward.id,
      type: reward.eventType,
      title: this.getRewardTitle(reward.eventType),
      description: this.getRewardDescription(reward.eventType),
      points: reward.points,
      discount: reward.discount,
      eventDate: reward.eventDate,
      claimed: reward.claimed,
      claimedAt: reward.claimedAt,
      expiresAt: reward.expiresAt
    }))
  }

  async getUpcomingRewards(customerId: string) {
    const now = new Date()
    const rewards = await this.prisma.specialDateReward.findMany({
      where: {
        customerId,
        eventDate: { gt: now },
        claimed: false
      },
      orderBy: { eventDate: 'asc' },
      take: 5
    })

    return rewards.map(reward => ({
      id: reward.id,
      type: reward.eventType,
      title: this.getRewardTitle(reward.eventType),
      daysUntil: Math.ceil((reward.eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      points: reward.points,
      discount: reward.discount
    }))
  }

  async claimReward(customerId: string, rewardId: string) {
    const reward = await this.prisma.specialDateReward.update({
      where: { id: rewardId },
      data: {
        claimed: true,
        claimedAt: new Date()
      }
    })

    return {
      success: true,
      message: `تم استلام المكافأة بنجاح`,
      reward: {
        id: reward.id,
        points: reward.points,
        discount: reward.discount
      }
    }
  }

  async getRewardHistory(customerId: string) {
    const rewards = await this.prisma.specialDateReward.findMany({
      where: {
        customerId,
        claimed: true
      },
      orderBy: { claimedAt: 'desc' }
    })

    return rewards.map(reward => ({
      id: reward.id,
      type: reward.eventType,
      title: this.getRewardTitle(reward.eventType),
      points: reward.points,
      discount: reward.discount,
      claimedAt: reward.claimedAt
    }))
  }

  async getRewardDetails(rewardId: string) {
    const reward = await this.prisma.specialDateReward.findUnique({
      where: { id: rewardId }
    })

    if (!reward) {
      throw new Error('Reward not found')
    }

    return {
      id: reward.id,
      type: reward.eventType,
      title: this.getRewardTitle(reward.eventType),
      description: this.getRewardDescription(reward.eventType),
      points: reward.points,
      discount: reward.discount,
      eventDate: reward.eventDate,
      expiresAt: reward.expiresAt,
      terms: this.getRewardTerms(reward.eventType)
    }
  }

  async getAllRewards() {
    return [
      {
        id: 'birthday',
        type: 'birthday',
        title: 'عيد الميلاد',
        icon: '🎂',
        description: 'احصل على مكافأة خاصة في عيد ميلادك',
        points: 500,
        discount: 25,
        frequency: 'سنوي'
      },
      {
        id: 'anniversary',
        type: 'anniversary',
        title: 'ذكرى الاشتراك',
        icon: '🎉',
        description: 'احتفل معنا بذكرى اشتراكك',
        points: 300,
        discount: 15,
        frequency: 'سنوي'
      },
      {
        id: 'holiday',
        type: 'holiday',
        title: 'العطل الرسمية',
        icon: '🎊',
        description: 'عروض خاصة في المناسبات الرسمية',
        points: 200,
        discount: 10,
        frequency: 'متعدد'
      },
      {
        id: 'milestone',
        type: 'milestone',
        title: 'الإنجازات',
        icon: '⭐',
        description: 'مكافآت عند الوصول لإنجازات معينة',
        points: 400,
        discount: 20,
        frequency: 'متغير'
      }
    ]
  }

  private getRewardTitle(eventType: string): string {
    const titles: { [key: string]: string } = {
      birthday: 'عيد الميلاد',
      anniversary: 'ذكرى الاشتراك',
      holiday: 'العطل الرسمية',
      milestone: 'الإنجازات'
    }
    return titles[eventType] || eventType
  }

  private getRewardDescription(eventType: string): string {
    const descriptions: { [key: string]: string } = {
      birthday: 'احصل على 500 نقطة و 25% خصم في عيد ميلادك',
      anniversary: 'احتفل معنا بذكرى اشتراكك واحصل على 300 نقطة و 15% خصم',
      holiday: 'عروض خاصة في المناسبات الرسمية - 200 نقطة و 10% خصم',
      milestone: 'مكافآت عند الوصول لإنجازات معينة - 400 نقطة و 20% خصم'
    }
    return descriptions[eventType] || ''
  }

  private getRewardTerms(eventType: string): string[] {
    const terms: { [key: string]: string[] } = {
      birthday: [
        'صالح لمدة 30 يوم من تاريخ عيد الميلاد',
        'يمكن استخدامه مع عروض أخرى',
        'غير قابل للتحويل'
      ],
      anniversary: [
        'صالح لمدة 30 يوم من تاريخ الذكرى',
        'حصري للعملاء المسجلين',
        'غير قابل للاسترجاع'
      ],
      holiday: [
        'صالح خلال فترة العطلة المحددة',
        'قد يكون محدود الكمية',
        'غير قابل للتراكم'
      ],
      milestone: [
        'صالح لمدة 60 يوم',
        'يتطلب تحقيق الشروط المحددة',
        'غير قابل للتحويل'
      ]
    }
    return terms[eventType] || []
  }
}
