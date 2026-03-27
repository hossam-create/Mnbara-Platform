import { PrismaClient } from '@prisma/client'

export class OffersService {
  private prisma = new PrismaClient()

  async getPersonalizedOffers(customerId: string) {
    // Get customer segment and purchase history
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { purchases: { take: 10 } }
    })

    if (!customer) {
      return []
    }

    // Generate personalized offers based on purchase history
    const offers = [
      {
        id: 1,
        title: 'خصم 30% على الإلكترونيات',
        description: 'بناءً على تاريخ شرائك من فئة الإلكترونيات',
        discount: 30,
        category: 'إلكترونيات',
        expiresIn: '3 أيام',
        minPurchase: 500,
        icon: '📱',
        applied: false
      },
      {
        id: 2,
        title: 'شحن مجاني على الملابس',
        description: 'عرض خاص للعملاء المتكررين',
        discount: 'مجاني',
        category: 'ملابس',
        expiresIn: '7 أيام',
        minPurchase: 200,
        icon: '👕',
        applied: false
      },
      {
        id: 3,
        title: 'اشتري 2 واحصل على 1 مجاني',
        description: 'على المنتجات المختارة من الكتب',
        discount: '50%',
        category: 'كتب',
        expiresIn: '5 أيام',
        minPurchase: 100,
        icon: '📚',
        applied: false
      },
      {
        id: 4,
        title: 'خصم 25% على الأثاث',
        description: 'عرض حصري للعملاء VIP',
        discount: 25,
        category: 'أثاث',
        expiresIn: '10 أيام',
        minPurchase: 1000,
        icon: '🛋️',
        applied: false
      }
    ]

    return offers
  }

  async applyOffer(customerId: string, offerId: string) {
    const appliedOffer = await this.prisma.appliedOffer.create({
      data: {
        customerId,
        offerId,
        appliedAt: new Date()
      }
    })

    return {
      success: true,
      offerId,
      appliedAt: appliedOffer.appliedAt,
      message: 'تم تطبيق العرض بنجاح'
    }
  }

  async getOfferHistory(customerId: string) {
    const history = await this.prisma.appliedOffer.findMany({
      where: { customerId },
      orderBy: { appliedAt: 'desc' },
      take: 20
    })

    return history.map(h => ({
      offerId: h.offerId,
      appliedAt: h.appliedAt,
      status: 'مستخدم',
      savings: Math.floor(Math.random() * 200) + 50
    }))
  }

  async getOfferDetails(offerId: string) {
    return {
      id: offerId,
      title: 'عرض خاص',
      description: 'وصف العرض',
      discount: 20,
      category: 'عام',
      expiresIn: '7 أيام',
      minPurchase: 100,
      terms: [
        'ينطبق على المنتجات المختارة فقط',
        'لا يمكن دمجه مع عروض أخرى',
        'صالح لمدة 7 أيام من التطبيق'
      ]
    }
  }
}
