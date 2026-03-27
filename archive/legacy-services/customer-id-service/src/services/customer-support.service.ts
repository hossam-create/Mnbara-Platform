import { PrismaClient } from '@prisma/client'

export class CustomerSupportService {
  private prisma = new PrismaClient()

  async getLiveChatSessions(customerId: string) {
    const sessions = await this.prisma.liveChatSession.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return sessions.map(session => ({
      id: session.id,
      topic: session.topic,
      status: session.status,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      agentName: session.agentName,
      rating: session.rating
    }))
  }

  async startLiveChat(customerId: string, topic: string, message: string) {
    const session = await this.prisma.liveChatSession.create({
      data: {
        customerId,
        topic,
        status: 'active',
        messages: {
          create: {
            customerId,
            message,
            senderType: 'customer'
          }
        }
      },
      include: { messages: true }
    })

    return {
      sessionId: session.id,
      topic: session.topic,
      status: session.status,
      message: 'تم بدء جلسة الدعم بنجاح',
      estimatedWaitTime: '2-5 دقائق'
    }
  }

  async sendChatMessage(sessionId: string, customerId: string, message: string) {
    const chatMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        customerId,
        message,
        senderType: 'customer'
      }
    })

    return {
      messageId: chatMessage.id,
      timestamp: chatMessage.createdAt,
      status: 'sent'
    }
  }

  async getChatHistory(sessionId: string) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    })

    return messages.map(msg => ({
      id: msg.id,
      message: msg.message,
      senderType: msg.senderType,
      senderName: msg.senderType === 'customer' ? 'أنت' : 'وكيل الدعم',
      timestamp: msg.createdAt
    }))
  }

  async getFAQ(category?: string) {
    const faqItems = await this.prisma.faqItem.findMany({
      where: category ? { category } : {},
      orderBy: { order: 'asc' }
    })

    return faqItems.map(item => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
      category: item.category,
      helpful: item.helpfulCount,
      views: item.viewCount
    }))
  }

  async searchFAQ(query: string) {
    const results = await this.prisma.faqItem.findMany({
      where: {
        OR: [
          { question: { contains: query, mode: 'insensitive' } },
          { answer: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 10
    })

    return results.map(item => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
      category: item.category,
      relevance: this.calculateRelevance(query, item.question)
    }))
  }

  async getSupportCategories() {
    return [
      {
        id: 'account',
        name: 'الحساب والملف الشخصي',
        icon: '👤',
        description: 'مساعدة في إدارة حسابك',
        topics: ['تسجيل الدخول', 'تغيير كلمة المرور', 'تحديث البيانات']
      },
      {
        id: 'orders',
        name: 'الطلبات والشحن',
        icon: '📦',
        description: 'معلومات عن طلباتك والشحن',
        topics: ['تتبع الطلب', 'إلغاء الطلب', 'تغيير العنوان']
      },
      {
        id: 'payments',
        name: 'الدفع والفواتير',
        icon: '💳',
        description: 'مساعدة في الدفع والفواتير',
        topics: ['طرق الدفع', 'استرجاع المبلغ', 'الفاتورة']
      },
      {
        id: 'returns',
        name: 'الإرجاع والاستبدال',
        icon: '🔄',
        description: 'سياسة الإرجاع والاستبدال',
        topics: ['طلب إرجاع', 'استبدال المنتج', 'حالة الإرجاع']
      },
      {
        id: 'products',
        name: 'المنتجات والمواصفات',
        icon: '📋',
        description: 'معلومات عن المنتجات',
        topics: ['المواصفات', 'التوفر', 'المقارنة']
      },
      {
        id: 'technical',
        name: 'المشاكل التقنية',
        icon: '⚙️',
        description: 'حل المشاكل التقنية',
        topics: ['مشاكل التطبيق', 'مشاكل الموقع', 'الأداء']
      }
    ]
  }

  async closeChatSession(sessionId: string) {
    const session = await this.prisma.liveChatSession.update({
      where: { id: sessionId },
      data: {
        status: 'closed',
        closedAt: new Date()
      }
    })

    return {
      success: true,
      message: 'تم إغلاق جلسة الدعم',
      sessionId: session.id,
      duration: this.calculateDuration(session.createdAt, session.closedAt)
    }
  }

  private calculateRelevance(query: string, text: string): number {
    const queryWords = query.toLowerCase().split(' ')
    const textLower = text.toLowerCase()
    let matches = 0

    queryWords.forEach(word => {
      if (textLower.includes(word)) {
        matches++
      }
    })

    return Math.round((matches / queryWords.length) * 100)
  }

  private calculateDuration(startDate: Date, endDate: Date | null): string {
    if (!endDate) return 'جارية'

    const diffMs = endDate.getTime() - startDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'أقل من دقيقة'
    if (diffMins < 60) return `${diffMins} دقيقة`

    const diffHours = Math.floor(diffMins / 60)
    return `${diffHours} ساعة و ${diffMins % 60} دقيقة`
  }
}
