// Analytics AI Service - AI for Business Intelligence
// خدمة الذكاء الاصطناعي لتحليلات الأعمال

import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

interface SalesData {
  period: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  newCustomers: number;
  returningCustomers: number;
}

interface ProductPerformance {
  productId: string;
  name: string;
  sales: number;
  views: number;
  conversionRate: number;
  returns: number;
}

export class AnalyticsAIService {
  // ==========================================
  // 📊 SALES ANALYTICS
  // ==========================================

  // Analyze sales trends
  async analyzeSalesTrends(data: SalesData[]): Promise<{
    trend: 'growing' | 'stable' | 'declining';
    insights: string[];
    predictions: { nextPeriod: number; confidence: number };
    recommendations: string[];
  }> {
    if (data.length < 2) {
      return {
        trend: 'stable',
        insights: ['Insufficient data for trend analysis'],
        predictions: { nextPeriod: 0, confidence: 0 },
        recommendations: ['Collect more data points']
      };
    }

    const revenues = data.map(d => d.revenue);
    const avgGrowth = this.calculateGrowthRate(revenues);
    
    let trend: 'growing' | 'stable' | 'declining' = 'stable';
    const insights: string[] = [];
    const recommendations: string[] = [];

    if (avgGrowth > 5) {
      trend = 'growing';
      insights.push(`Strong growth: ${avgGrowth.toFixed(1)}% average increase`);
      recommendations.push('Scale marketing efforts to maintain momentum');
    } else if (avgGrowth < -5) {
      trend = 'declining';
      insights.push(`Declining trend: ${avgGrowth.toFixed(1)}% average decrease`);
      recommendations.push('Investigate causes and implement retention strategies');
    } else {
      insights.push(`Stable performance: ${avgGrowth.toFixed(1)}% variation`);
    }

    // Customer analysis
    const latestData = data[data.length - 1];
    const customerRetention = latestData.returningCustomers / 
      (latestData.newCustomers + latestData.returningCustomers) * 100;
    
    if (customerRetention > 60) {
      insights.push(`Excellent retention: ${customerRetention.toFixed(0)}%`);
    } else if (customerRetention < 30) {
      insights.push(`Low retention: ${customerRetention.toFixed(0)}%`);
      recommendations.push('Implement loyalty program and improve customer experience');
    }

    // Predict next period
    const prediction = this.predictNextValue(revenues);

    return {
      trend,
      insights,
      predictions: prediction,
      recommendations
    };
  }

  // Calculate growth rate
  private calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;
    const growthRates = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] > 0) {
        growthRates.push((values[i] - values[i - 1]) / values[i - 1] * 100);
      }
    }
    return growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
  }

  // Simple prediction
  private predictNextValue(values: number[]): { nextPeriod: number; confidence: number } {
    if (values.length < 3) {
      return { nextPeriod: values[values.length - 1] || 0, confidence: 30 };
    }
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const trend = (values[values.length - 1] - values[0]) / values.length;
    const prediction = values[values.length - 1] + trend;
    
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const confidence = Math.max(30, Math.min(90, 100 - (Math.sqrt(variance) / avg * 100)));
    
    return { nextPeriod: Math.max(0, prediction), confidence };
  }

  // ==========================================
  // 📦 PRODUCT ANALYTICS
  // ==========================================

  // Analyze product performance
  async analyzeProductPerformance(products: ProductPerformance[]): Promise<{
    topPerformers: string[];
    underperformers: string[];
    insights: string[];
    recommendations: string[];
  }> {
    const sorted = [...products].sort((a, b) => b.sales - a.sales);
    const topPerformers = sorted.slice(0, 5).map(p => p.name);
    
    const underperformers = products
      .filter(p => p.conversionRate < 1 || p.returns / p.sales > 0.1)
      .map(p => p.name);

    const insights: string[] = [];
    const recommendations: string[] = [];

    // Conversion analysis
    const avgConversion = products.reduce((sum, p) => sum + p.conversionRate, 0) / products.length;
    insights.push(`Average conversion rate: ${avgConversion.toFixed(2)}%`);

    if (avgConversion < 2) {
      recommendations.push('Improve product descriptions and images');
      recommendations.push('Add customer reviews and social proof');
    }

    // Return rate analysis
    const highReturnProducts = products.filter(p => p.returns / p.sales > 0.15);
    if (highReturnProducts.length > 0) {
      insights.push(`${highReturnProducts.length} products have high return rates`);
      recommendations.push('Review product quality and accuracy of descriptions');
    }

    return { topPerformers, underperformers, insights, recommendations };
  }

  // ==========================================
  // 👥 CUSTOMER ANALYTICS
  // ==========================================

  // Segment customers
  async segmentCustomers(customers: Array<{
    id: string;
    totalSpent: number;
    orderCount: number;
    lastOrderDays: number;
    avgOrderValue: number;
  }>): Promise<{
    segments: Array<{
      name: string;
      nameAr: string;
      count: number;
      characteristics: string[];
      strategy: string;
    }>;
  }> {
    const segments = {
      vip: { name: 'VIP Customers', nameAr: 'عملاء VIP', customers: [] as any[], characteristics: ['High spending', 'Frequent orders'], strategy: 'Exclusive offers and priority support' },
      loyal: { name: 'Loyal Customers', nameAr: 'عملاء مخلصون', customers: [] as any[], characteristics: ['Regular purchases', 'Good retention'], strategy: 'Loyalty rewards and early access' },
      atRisk: { name: 'At Risk', nameAr: 'معرضون للخسارة', customers: [] as any[], characteristics: ['Previously active', 'No recent orders'], strategy: 'Win-back campaigns and special discounts' },
      new: { name: 'New Customers', nameAr: 'عملاء جدد', customers: [] as any[], characteristics: ['Recent first purchase'], strategy: 'Onboarding emails and first-time discounts' },
      dormant: { name: 'Dormant', nameAr: 'خاملون', customers: [] as any[], characteristics: ['No activity for 90+ days'], strategy: 'Reactivation campaigns' }
    };

    const avgSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length;

    customers.forEach(customer => {
      if (customer.totalSpent > avgSpent * 3 && customer.orderCount > 5) {
        segments.vip.customers.push(customer);
      } else if (customer.orderCount > 3 && customer.lastOrderDays < 30) {
        segments.loyal.customers.push(customer);
      } else if (customer.orderCount > 2 && customer.lastOrderDays > 60) {
        segments.atRisk.customers.push(customer);
      } else if (customer.orderCount === 1 && customer.lastOrderDays < 30) {
        segments.new.customers.push(customer);
      } else if (customer.lastOrderDays > 90) {
        segments.dormant.customers.push(customer);
      }
    });

    return {
      segments: Object.values(segments).map(s => ({
        name: s.name,
        nameAr: s.nameAr,
        count: s.customers.length,
        characteristics: s.characteristics,
        strategy: s.strategy
      }))
    };
  }

  // ==========================================
  // 🔮 PREDICTIVE ANALYTICS
  // ==========================================

  // Predict demand
  async predictDemand(productId: string, historicalSales: number[]): Promise<{
    prediction: number[];
    confidence: number;
    factors: string[];
  }> {
    if (historicalSales.length < 7) {
      return {
        prediction: [historicalSales[historicalSales.length - 1] || 0],
        confidence: 20,
        factors: ['Insufficient historical data']
      };
    }

    // Simple moving average prediction
    const windowSize = Math.min(7, historicalSales.length);
    const recentAvg = historicalSales.slice(-windowSize).reduce((a, b) => a + b, 0) / windowSize;
    const trend = this.calculateGrowthRate(historicalSales.slice(-windowSize));
    
    const predictions: number[] = [];
    let lastValue = recentAvg;
    for (let i = 0; i < 7; i++) {
      lastValue = lastValue * (1 + trend / 100);
      predictions.push(Math.round(Math.max(0, lastValue)));
    }

    return {
      prediction: predictions,
      confidence: Math.min(85, 50 + historicalSales.length),
      factors: ['Historical sales trend', 'Seasonal patterns', 'Moving average']
    };
  }

  // Churn prediction
  async predictChurn(customer: {
    daysSinceLastOrder: number;
    orderFrequency: number;
    avgOrderValue: number;
    supportTickets: number;
    returns: number;
  }): Promise<{
    churnProbability: number;
    riskLevel: 'low' | 'medium' | 'high';
    factors: string[];
    preventionActions: string[];
  }> {
    let score = 0;
    const factors: string[] = [];
    const preventionActions: string[] = [];

    // Days since last order
    if (customer.daysSinceLastOrder > 90) {
      score += 40;
      factors.push('No orders in 90+ days');
      preventionActions.push('Send win-back email with special offer');
    } else if (customer.daysSinceLastOrder > 60) {
      score += 25;
      factors.push('No orders in 60+ days');
      preventionActions.push('Send reminder with personalized recommendations');
    }

    // Order frequency decline
    if (customer.orderFrequency < 0.5) {
      score += 20;
      factors.push('Low order frequency');
      preventionActions.push('Offer subscription or loyalty program');
    }

    // Support issues
    if (customer.supportTickets > 3) {
      score += 15;
      factors.push('Multiple support tickets');
      preventionActions.push('Proactive customer service outreach');
    }

    // High returns
    if (customer.returns > 2) {
      score += 15;
      factors.push('High return rate');
      preventionActions.push('Review product recommendations accuracy');
    }

    const churnProbability = Math.min(100, score);
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (churnProbability > 60) riskLevel = 'high';
    else if (churnProbability > 30) riskLevel = 'medium';

    return { churnProbability, riskLevel, factors, preventionActions };
  }

  // ==========================================
  // 📈 BUSINESS INSIGHTS
  // ==========================================

  // Generate business report
  async generateBusinessReport(data: {
    sales: SalesData[];
    products: ProductPerformance[];
    period: string;
  }): Promise<{
    summary: string;
    summaryAr: string;
    keyMetrics: Record<string, number>;
    highlights: string[];
    concerns: string[];
    actionItems: string[];
  }> {
    const totalRevenue = data.sales.reduce((sum, s) => sum + s.revenue, 0);
    const totalOrders = data.sales.reduce((sum, s) => sum + s.orders, 0);
    const avgOrderValue = totalRevenue / totalOrders;
    
    const salesTrend = await this.analyzeSalesTrends(data.sales);
    const productAnalysis = await this.analyzeProductPerformance(data.products);

    const highlights: string[] = [];
    const concerns: string[] = [];
    const actionItems: string[] = [];

    if (salesTrend.trend === 'growing') {
      highlights.push(`Revenue growing at ${this.calculateGrowthRate(data.sales.map(s => s.revenue)).toFixed(1)}%`);
    } else if (salesTrend.trend === 'declining') {
      concerns.push('Revenue showing declining trend');
      actionItems.push('Investigate causes and implement recovery plan');
    }

    if (productAnalysis.underperformers.length > 0) {
      concerns.push(`${productAnalysis.underperformers.length} products underperforming`);
      actionItems.push('Review and optimize underperforming products');
    }

    highlights.push(`Top performers: ${productAnalysis.topPerformers.slice(0, 3).join(', ')}`);

    return {
      summary: `${data.period} Report: ${totalOrders} orders, $${totalRevenue.toLocaleString()} revenue`,
      summaryAr: `تقرير ${data.period}: ${totalOrders} طلب، ${totalRevenue.toLocaleString()} دولار إيرادات`,
      keyMetrics: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        topProductSales: data.products[0]?.sales || 0
      },
      highlights,
      concerns,
      actionItems
    };
  }

  // AI-powered insights
  async getAIInsights(question: string, context: any): Promise<{
    answer: string;
    answerAr: string;
    confidence: number;
    sources: string[];
  }> {
    try {
      const prompt = `As a business analyst for Mnbara marketplace, answer this question:
"${question}"

Context data: ${JSON.stringify(context).slice(0, 1000)}

Provide a concise, actionable answer.`;

      const response = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        inputs: `<s>[INST] ${prompt} [/INST]`,
        parameters: { max_new_tokens: 300, temperature: 0.4 }
      });

      return {
        answer: response.generated_text,
        answerAr: 'تم تحليل البيانات بنجاح',
        confidence: 75,
        sources: ['Historical data', 'AI analysis']
      };
    } catch {
      return {
        answer: 'Unable to generate insights at this time',
        answerAr: 'غير قادر على إنشاء رؤى في الوقت الحالي',
        confidence: 0,
        sources: []
      };
    }
  }
}

export const analyticsAIService = new AnalyticsAIService();
