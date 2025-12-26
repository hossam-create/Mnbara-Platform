import { prisma } from '../index';

interface CreateInstallmentInput {
  userId: string;
  orderId: string;
  planId: string;
  totalAmount: number;
}

export const installmentService = {
  /**
   * Create new installment
   * إنشاء خطة دفع جديدة
   */
  async createInstallment(input: CreateInstallmentInput) {
    const { userId, orderId, planId, totalAmount } = input;

    // Get plan
    const plan = await prisma.bNPLPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    // Calculate installment amount
    const installmentAmount = totalAmount / plan.installmentCount;
    const interestAmount = (totalAmount * plan.interestRate) / 100;

    // Create installment
    const installment = await prisma.installment.create({
      data: {
        userId,
        orderId,
        planId,
        totalAmount,
        installmentAmount,
        interestAmount,
        status: 'pending',
        startDate: new Date(),
        endDate: new Date(Date.now() + plan.installmentCount * 30 * 24 * 60 * 60 * 1000)
      },
      include: {
        plan: true
      }
    });

    // Create payment schedule
    for (let i = 0; i < plan.installmentCount; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i + 1);

      await prisma.payment.create({
        data: {
          installmentId: installment.id,
          amount: installmentAmount,
          dueDate,
          status: 'pending'
        }
      });
    }

    return installment;
  },

  /**
   * Get user credit score
   * الحصول على درجة ائتمان المستخدم
   */
  async getUserCreditScore(userId: string) {
    let creditScore = await prisma.creditScore.findUnique({
      where: { userId }
    });

    if (!creditScore) {
      creditScore = await prisma.creditScore.create({
        data: {
          userId,
          score: 500
        }
      });
    }

    return creditScore;
  },

  /**
   * Update credit score based on payment history
   * تحديث درجة الائتمان بناءً على سجل الدفع
   */
  async updateCreditScore(userId: string) {
    const creditScore = await this.getUserCreditScore(userId);

    // Get user's installments
    const installments = await prisma.installment.findMany({
      where: { userId },
      include: { payments: true }
    });

    let score = 500;
    let completedOrders = 0;
    let defaultedOrders = 0;
    let latePayments = 0;

    for (const installment of installments) {
      if (installment.status === 'completed') {
        completedOrders++;
        score += 50;
      } else if (installment.status === 'defaulted') {
        defaultedOrders++;
        score -= 100;
      }

      // Check for late payments
      for (const payment of installment.payments) {
        if (payment.status === 'overdue') {
          latePayments++;
          score -= 20;
        }
      }
    }

    // Cap score between 300 and 850
    score = Math.max(300, Math.min(850, score));

    // Update credit score
    await prisma.creditScore.update({
      where: { userId },
      data: {
        score,
        totalOrders: installments.length,
        completedOrders,
        defaultedOrders,
        latePayments
      }
    });

    return { score, completedOrders, defaultedOrders, latePayments };
  },

  /**
   * Check if user is eligible for BNPL
   * التحقق من أهلية المستخدم للدفع المقسط
   */
  async isUserEligible(userId: string, amount: number): Promise<boolean> {
    const creditScore = await this.getUserCreditScore(userId);

    // Minimum credit score: 400
    if (creditScore.score < 400) {
      return false;
    }

    // Check for active defaulted installments
    const defaultedInstallments = await prisma.installment.count({
      where: {
        userId,
        status: 'defaulted'
      }
    });

    if (defaultedInstallments > 0) {
      return false;
    }

    // Check total active installments
    const activeInstallments = await prisma.installment.count({
      where: {
        userId,
        status: 'active'
      }
    });

    // Maximum 3 active installments
    if (activeInstallments >= 3) {
      return false;
    }

    return true;
  },

  /**
   * Get recommended plan for user
   * الحصول على الخطة الموصى بها للمستخدم
   */
  async getRecommendedPlan(userId: string, amount: number) {
    const creditScore = await this.getUserCreditScore(userId);

    // Get all active plans
    const plans = await prisma.bNPLPlan.findMany({
      where: { isActive: true },
      orderBy: { installmentCount: 'asc' }
    });

    // Filter plans based on amount
    const eligiblePlans = plans.filter(
      plan => amount >= plan.minAmount && amount <= plan.maxAmount
    );

    if (eligiblePlans.length === 0) {
      return null;
    }

    // Recommend based on credit score
    if (creditScore.score >= 700) {
      // Best credit: 3-month plan
      return eligiblePlans.find(p => p.installmentCount === 3) || eligiblePlans[0];
    } else if (creditScore.score >= 600) {
      // Good credit: 6-month plan
      return eligiblePlans.find(p => p.installmentCount === 6) || eligiblePlans[0];
    } else {
      // Fair credit: 12-month plan
      return eligiblePlans.find(p => p.installmentCount === 12) || eligiblePlans[0];
    }
  }
};
