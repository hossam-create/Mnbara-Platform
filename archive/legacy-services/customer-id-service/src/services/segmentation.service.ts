import { PrismaClient } from '@prisma/client'

export class SegmentationService {
  private prisma = new PrismaClient()

  async getCustomerSegment(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { segment: true }
    })

    if (!customer) {
      return { segment: 'occasional', criteria: 'New customer' }
    }

    return {
      segment: customer.segment?.name || 'occasional',
      criteria: customer.segment?.criteria || 'New customer',
      benefits: customer.segment?.benefits || [],
      joinDate: customer.createdAt
    }
  }

  async getAllSegments() {
    return [
      {
        id: 'vip',
        name: 'VIP',
        icon: '👑',
        description: 'أعلى 5% من المشترين',
        criteria: 'إنفاق أكثر من 50,000 ريال',
        benefits: ['خصم 25%', 'مدير حساب مخصص', 'أولوية مطلقة في الدعم', 'عروض حصرية'],
        members: 750,
        discount: 25
      },
      {
        id: 'frequent',
        name: 'المشترون المتكررون',
        icon: '⭐',
        description: 'المشترون المنتظمون',
        criteria: 'أكثر من 10 عمليات شراء سنوياً',
        benefits: ['خصم 15%', 'شحن مجاني', 'دعم أولوي', 'عروض خاصة'],
        members: 5200,
        discount: 15
      },
      {
        id: 'occasional',
        name: 'المشترون العرضيون',
        icon: '🛍️',
        description: 'المشترون غير المنتظمين',
        criteria: '1-10 عمليات شراء سنوياً',
        benefits: ['خصم 10%', 'عروض موسمية', 'دعم عادي'],
        members: 8900,
        discount: 10
      },
      {
        id: 'inactive',
        name: 'غير النشطين',
        icon: '😴',
        description: 'لم يشتروا في آخر 90 يوم',
        criteria: 'عدم النشاط لمدة 90 يوم',
        benefits: ['عروض استرجاع', 'خصم ترحيب', 'رسائل تذكيرية'],
        members: 3400,
        discount: 20
      },
      {
        id: 'at_risk',
        name: 'المعرضون للخطر',
        icon: '⚠️',
        description: 'انخفاض في النشاط',
        criteria: 'انخفاض 50% في الشراء',
        benefits: ['عروض خاصة', 'خصم 20%', 'استطلاع رأي'],
        members: 1200,
        discount: 20
      }
    ]
  }

  async getSegmentBenefits(segment: string) {
    const segments = await this.getAllSegments()
    const segmentData = segments.find(s => s.id === segment)
    return segmentData?.benefits || []
  }

  async getSegmentStats() {
    const segments = await this.getAllSegments()
    const totalMembers = segments.reduce((sum, s) => sum + s.members, 0)

    return {
      totalSegments: segments.length,
      totalMembers,
      segments: segments.map(s => ({
        name: s.name,
        members: s.members,
        percentage: Math.round((s.members / totalMembers) * 100)
      }))
    }
  }

  async updateCustomerSegment(customerId: string, segment: string) {
    const segments = await this.getAllSegments()
    const segmentData = segments.find(s => s.id === segment)

    if (!segmentData) {
      throw new Error('Invalid segment')
    }

    const customer = await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        segment: {
          connect: { id: segment }
        }
      }
    })

    return {
      customerId: customer.id,
      segment: segment,
      benefits: segmentData.benefits,
      discount: segmentData.discount
    }
  }
}
