// Analytics AI Controller - Mnbara AI
// متحكم الذكاء الاصطناعي للتحليلات

import { Request, Response } from 'express';
import { analyticsAIService } from '../services/analytics-ai.service';

export class AnalyticsAIController {
  // ==========================================
  // 📊 SALES ANALYTICS
  // ==========================================

  // Analyze sales trends
  async analyzeSalesTrends(req: Request, res: Response) {
    try {
      const { data } = req.body;

      if (!data || !Array.isArray(data)) {
        return res.status(400).json({
          success: false,
          message: 'Sales data array is required',
          messageAr: 'مصفوفة بيانات المبيعات مطلوبة'
        });
      }

      const analysis = await analyticsAIService.analyzeSalesTrends(data);

      res.json({
        success: true,
        data: analysis
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل تحليل اتجاهات المبيعات'
      });
    }
  }

  // ==========================================
  // 📦 PRODUCT ANALYTICS
  // ==========================================

  // Analyze product performance
  async analyzeProductPerformance(req: Request, res: Response) {
    try {
      const { products } = req.body;

      if (!products || !Array.isArray(products)) {
        return res.status(400).json({
          success: false,
          message: 'Products array is required',
          messageAr: 'مصفوفة المنتجات مطلوبة'
        });
      }

      const analysis = await analyticsAIService.analyzeProductPerformance(products);

      res.json({
        success: true,
        data: analysis
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل تحليل أداء المنتجات'
      });
    }
  }

  // ==========================================
  // 👥 CUSTOMER ANALYTICS
  // ==========================================

  // Segment customers
  async segmentCustomers(req: Request, res: Response) {
    try {
      const { customers } = req.body;

      if (!customers || !Array.isArray(customers)) {
        return res.status(400).json({
          success: false,
          message: 'Customers array is required',
          messageAr: 'مصفوفة العملاء مطلوبة'
        });
      }

      const segments = await analyticsAIService.segmentCustomers(customers);

      res.json({
        success: true,
        data: segments
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل تقسيم العملاء'
      });
    }
  }

  // ==========================================
  // 🔮 PREDICTIVE ANALYTICS
  // ==========================================

  // Predict demand
  async predictDemand(req: Request, res: Response) {
    try {
      const { productId, historicalSales } = req.body;

      if (!productId || !historicalSales) {
        return res.status(400).json({
          success: false,
          message: 'Product ID and historical sales are required',
          messageAr: 'معرف المنتج والمبيعات التاريخية مطلوبان'
        });
      }

      const prediction = await analyticsAIService.predictDemand(productId, historicalSales);

      res.json({
        success: true,
        data: prediction
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل التنبؤ بالطلب'
      });
    }
  }

  // Predict churn
  async predictChurn(req: Request, res: Response) {
    try {
      const { customer } = req.body;

      if (!customer) {
        return res.status(400).json({
          success: false,
          message: 'Customer data is required',
          messageAr: 'بيانات العميل مطلوبة'
        });
      }

      const prediction = await analyticsAIService.predictChurn(customer);

      res.json({
        success: true,
        data: prediction
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل التنبؤ بالتسرب'
      });
    }
  }

  // ==========================================
  // 📈 BUSINESS INSIGHTS
  // ==========================================

  // Generate business report
  async generateReport(req: Request, res: Response) {
    try {
      const { sales, products, period } = req.body;

      if (!sales || !products || !period) {
        return res.status(400).json({
          success: false,
          message: 'Sales, products, and period are required',
          messageAr: 'المبيعات والمنتجات والفترة مطلوبة'
        });
      }

      const report = await analyticsAIService.generateBusinessReport({
        sales,
        products,
        period
      });

      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل إنشاء التقرير'
      });
    }
  }

  // Get AI insights
  async getInsights(req: Request, res: Response) {
    try {
      const { question, context } = req.body;

      if (!question) {
        return res.status(400).json({
          success: false,
          message: 'Question is required',
          messageAr: 'السؤال مطلوب'
        });
      }

      const insights = await analyticsAIService.getAIInsights(question, context || {});

      res.json({
        success: true,
        data: insights
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        messageAr: 'فشل الحصول على الرؤى'
      });
    }
  }
}

export const analyticsAIController = new AnalyticsAIController();
