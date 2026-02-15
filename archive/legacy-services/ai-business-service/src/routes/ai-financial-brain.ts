import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { AIFinancialBrain, FinancialQuestion, FinancialAnswer } from '../services/ai/AIFinancialBrain';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { rbacMiddleware } from '../middleware/rbac';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Initialize AI Financial Brain with OpenAI API key
const openaiApiKey = process.env['OPENAI_API_KEY'];
if (!openaiApiKey) {
  logger.warn('OpenAI API key not found in environment variables');
}

const aiFinancialBrain = new AIFinancialBrain(prisma, openaiApiKey || '');

// Ask financial question
router.post('/ask', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      question: z.string().min(1),
      language: z.enum(['en', 'ar']).default('en'),
      businessAccountId: z.string(),
      context: z.object({
        fiscalYear: z.number().optional(),
        fiscalQuarter: z.number().optional(),
        analysisType: z.string().optional(),
        scenarioId: z.string().optional()
      }).optional()
    });

    const data = schema.parse(req.body);
    const userId = req.user?.id;

    logger.info(`AI Financial Brain question from user ${userId}: ${data.question}`);

    if (!openaiApiKey) {
      return res.status(503).json({ 
        error: 'AI service not available - OpenAI API key not configured' 
      });
    }

    const answer = await aiFinancialBrain.askFinancialQuestion({
      question: data.question,
      language: data.language,
      businessAccountId: data.businessAccountId,
      context: data.context
    });

    res.json({ 
      success: true, 
      data: answer 
    });
  } catch (error) {
    logger.error('Failed to process financial question:', error);
    res.status(500).json({ 
      error: 'Failed to process financial question' 
    });
  }
});

// Get financial insights
router.get('/insights/:businessAccountId', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      language: z.enum(['en', 'ar']).default('en')
    });

    const { businessAccountId } = req.params;
    const { language } = schema.parse(req.query);

    if (!openaiApiKey) {
      return res.status(503).json({ 
        error: 'AI service not available - OpenAI API key not configured' 
      });
    }

    const insights = await aiFinancialBrain.getFinancialInsights(businessAccountId, language);
    res.json({ 
      success: true, 
      data: insights 
    });
  } catch (error) {
    logger.error('Failed to get financial insights:', error);
    res.status(500).json({ 
      error: 'Failed to get financial insights' 
    });
  }
});

// Explain financial metric
router.post('/explain-metric', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      metricName: z.string().min(1),
      businessAccountId: z.string(),
      language: z.enum(['en', 'ar']).default('en')
    });

    const data = schema.parse(req.body);

    if (!openaiApiKey) {
      return res.status(503).json({ 
        error: 'AI service not available - OpenAI API key not configured' 
      });
    }

    const explanation = await aiFinancialBrain.explainFinancialMetric(
      data.metricName,
      data.businessAccountId,
      data.language
    );

    res.json({ 
      success: true, 
      data: explanation 
    });
  } catch (error) {
    logger.error('Failed to explain financial metric:', error);
    res.status(500).json({ 
      error: 'Failed to explain financial metric' 
    });
  }
});

// Get conversation history
router.get('/history/:businessAccountId', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      limit: z.string().optional().transform(val => parseInt(val) || 50),
      offset: z.string().optional().transform(val => parseInt(val) || 0),
      language: z.enum(['en', 'ar']).optional()
    });

    const { businessAccountId } = req.params;
    const { limit, offset, language } = schema.parse(req.query);

    const where: any = {
      businessAccountId,
      analysisType: 'FINANCIAL_QUESTION'
    };

    if (language) {
      // Filter by language (stored in metadata)
      where.metadata = {
        path: [],
        string_contains: `"language":"${language}"`
      };
    }

    const history = await prisma.aIAnalysis.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        query: true,
        result: true,
        confidence: true,
        createdAt: true,
        metadata: true
      }
    });

    const total = await prisma.aIAnalysis.count({ where });

    res.json({ 
      success: true, 
      data: {
        history: history.map(item => ({
          id: item.id,
          question: item.query,
          answer: JSON.parse(item.result || '{}'),
          confidence: item.confidence,
          createdAt: item.createdAt,
          metadata: JSON.parse(item.metadata || '{}')
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get conversation history:', error);
    res.status(500).json({ 
      error: 'Failed to get conversation history' 
    });
  }
});

// Get available financial metrics
router.get('/metrics', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const metrics = [
      {
        name: 'gross_profit_margin',
        displayName: { en: 'Gross Profit Margin', ar: 'هامش الربح الإجمالي' },
        category: 'profitability',
        description: { 
          en: 'Measures the proportion of revenue left after accounting for cost of goods sold',
          ar: 'يقيس نسبة الإيرادات المتبقية بعد حساب تكلفة البضاعة المباعة'
        }
      },
      {
        name: 'net_profit_margin',
        displayName: { en: 'Net Profit Margin', ar: 'هامش الربح الصافي' },
        category: 'profitability',
        description: { 
          en: 'Measures how much of each dollar of revenue is converted into profit',
          ar: 'يقيس مقدار كل دولار من الإيرادات الذي يتم تحويله إلى ربح'
        }
      },
      {
        name: 'current_ratio',
        displayName: { en: 'Current Ratio', ar: 'نسبة السيولة الحالية' },
        category: 'liquidity',
        description: { 
          en: 'Measures the ability to pay short-term obligations',
          ar: 'يقيس القدرة على سداد الالتزامات قصيرة الأجل'
        }
      },
      {
        name: 'debt_to_equity',
        displayName: { en: 'Debt to Equity', ar: 'نسبة الديون إلى حقوق الملكية' },
        category: 'leverage',
        description: { 
          en: 'Measures financial leverage and risk',
          ar: 'يقيس الرافعة المالية والمخاطر'
        }
      },
      {
        name: 'asset_turnover',
        displayName: { en: 'Asset Turnover', ar: 'معدل دوران الأصول' },
        category: 'efficiency',
        description: { 
          en: 'Measures how efficiently assets are used to generate revenue',
          ar: 'يقيس كفاءة استخدام الأصول في توليد الإيرادات'
        }
      }
    ];

    res.json({ 
      success: true, 
      data: metrics 
    });
  } catch (error) {
    logger.error('Failed to get available metrics:', error);
    res.status(500).json({ 
      error: 'Failed to get available metrics' 
    });
  }
});

// Get suggested questions
router.get('/suggested-questions/:businessAccountId', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      language: z.enum(['en', 'ar']).default('en'),
      category: z.enum(['profitability', 'liquidity', 'leverage', 'efficiency', 'trends']).optional()
    });

    const { businessAccountId } = req.params;
    const { language, category } = schema.parse(req.query);

    const questions = {
      en: {
        profitability: [
          'What is driving our profit margin changes?',
          'How does our profitability compare to industry benchmarks?',
          'What are the main factors affecting our gross profit?'
        ],
        liquidity: [
          'Do we have enough cash to cover our short-term obligations?',
          'How has our working capital changed over time?',
          'What is causing our current ratio to decline?'
        ],
        leverage: [
          'Are we taking on too much debt?',
          'How does our debt level affect our financial flexibility?',
          'What is our capacity to take on additional debt?'
        ],
        efficiency: [
          'How efficiently are we using our assets?',
          'What is driving our inventory turnover changes?',
          'How can we improve our asset utilization?'
        ],
        trends: [
          'What are the key trends in our financial performance?',
          'How are we performing compared to previous periods?',
          'What seasonal patterns do we see in our business?'
        ]
      },
      ar: {
        profitability: [
          'ما الذي يسبب تغيرات هوامش ربحنا؟',
          'كيف تcompare ربحيتنا بمعايير الصناعة؟',
          'ما هي العوامل الرئيسية المؤثرة على ربحنا الإجمالي؟'
        ],
        liquidity: [
          'هل لدينا سيولة كافية لتغطية التزاماتنا قصيرة الأجل؟',
          'كيف تغير رأس المال العامل لدينا بمرور الوقت؟',
          'ما الذي يسبب انخفاض نسبة السيولة الحالية لدينا؟'
        ],
        leverage: [
          'هل نأخذ ديونًا أكثر من اللازم؟',
          'كيف يؤثر مستوى الديون على مرونتنا المالية؟',
          'ما هي قدرتنا على أخذ ديون إضافية؟'
        ],
        efficiency: [
          'كيف نستخدم أصولنا بكفاءة؟',
          'ما الذي يسبب تغيرات معدل دوران المخزون لدينا؟',
          'كيف يمكننا تحسين استخدام أصولنا؟'
        ],
        trends: [
          'ما هي الاتجاهات الرئيسية في أدائنا المالي؟',
          'كيف نؤدي مقارنة بالفترات السابقة؟',
          'ما هي الأنماط الموسمية التي نراها في عملنا؟'
        ]
      }
    };

    const suggestedQuestions = category 
      ? questions[language][category] || []
      : Object.values(questions[language]).flat();

    res.json({ 
      success: true, 
      data: {
        questions: suggestedQuestions,
        category,
        language
      }
    });
  } catch (error) {
    logger.error('Failed to get suggested questions:', error);
    res.status(500).json({ 
      error: 'Failed to get suggested questions' 
    });
  }
});

// Health check for AI service
router.get('/health', async (req: any, res: any) => {
  try {
    const isConfigured = !!openaiApiKey;
    const status = isConfigured ? 'healthy' : 'misconfigured';
    
    res.json({ 
      success: true, 
      data: {
        status,
        openaiConfigured: isConfigured,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Health check failed' 
    });
  }
});

export default router;
