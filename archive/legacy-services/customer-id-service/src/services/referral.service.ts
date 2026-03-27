import { PrismaClient } from '@prisma/client'
import * as crypto from 'crypto'

export class ReferralService {
  private prisma = new PrismaClient()

  async generateReferralLink(customerId: string) {
    const referralCode = crypto.randomBytes(8).toString('hex').toUpperCase()
    
    const referral = await this.prisma.referral.upsert({
      where: { customerId },
      update: { referralCode },
      create: {
        customerId,
        referralCode,
        referralLink: `https://mnbara.com/ref/${referralCode}`,
        totalReferred: 0,
        totalRewards: 0
      }
    })

    return {
      referralLink: referral.referralLink,
      referralCode: referral.referralCode,
      shortCode: customerId.substring(0, 8).toUpperCase()
    }
  }

  async getReferralHistory(customerId: string) {
    const referrals = await this.prisma.referralHistory.findMany({
      where: { referrerId: customerId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return referrals.map(ref => ({
      id: ref.id,
      name: ref.referredName || 'عميل جديد',
      date: ref.createdAt,
      reward: ref.reward,
      status: ref.status
    }))
  }

  async getReferralRewards(customerId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { customerId }
    })

    if (!referral) {
      return { totalRewards: 0, completedRewards: 0, pendingRewards: 0 }
    }

    const history = await this.prisma.referralHistory.findMany({
      where: { referrerId: customerId }
    })

    const completed = history.filter(h => h.status === 'completed').length
    const pending = history.filter(h => h.status === 'pending').length

    return {
      totalRewards: referral.totalRewards,
      completedRewards: completed * 100,
      pendingRewards: pending * 100,
      totalReferred: referral.totalReferred
    }
  }

  async trackReferral(referrerId: string, referredId: string) {
    const referralHistory = await this.prisma.referralHistory.create({
      data: {
        referrerId,
        referredId,
        reward: 100,
        status: 'pending'
      }
    })

    // Update referral stats
    await this.prisma.referral.update({
      where: { customerId: referrerId },
      data: {
        totalReferred: { increment: 1 }
      }
    })

    return referralHistory
  }

  async getReferralStats(customerId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { customerId }
    })

    if (!referral) {
      return {
        totalReferred: 0,
        totalRewards: 0,
        successRate: 0,
        lastReferral: null
      }
    }

    const history = await this.prisma.referralHistory.findMany({
      where: { referrerId: customerId },
      orderBy: { createdAt: 'desc' }
    })

    const completed = history.filter(h => h.status === 'completed').length
    const successRate = history.length > 0 ? (completed / history.length) * 100 : 0

    return {
      totalReferred: referral.totalReferred,
      totalRewards: referral.totalRewards,
      successRate: Math.round(successRate),
      lastReferral: history[0]?.createdAt || null
    }
  }
}
