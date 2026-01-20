import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { FinancialAnalysisEngine, FinancialAnalysisResult } from '../financial-analysis/FinancialAnalysisEngine';
import { FinancialStatementsEngine } from '../financial/FinancialStatementsEngine';
import { logger } from '../../utils/logger';

export interface FinancialQuestion {
  question: string;
  language: 'en' | 'ar';
  businessAccountId: string;
  context?: {
    fiscalYear?: number;
    fiscalQuarter?: number;
    analysisType?: string;
    scenarioId?: string;
  };
}

export interface FinancialAnswer {
  answer: string;
  language: 'en' | 'ar';
  confidence: number;
  sources: string[];
  relatedMetrics: string[];
  followUpQuestions: string[];
  explanation: {
    what: string;
    why: string;
    implications: string;
    recommendations: string[];
  };
}

export interface FinancialFunction {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export class AIFinancialBrain {
  private openai: OpenAI;
  private prisma: PrismaClient;
  private financialAnalysisEngine: FinancialAnalysisEngine;
  private financialStatementsEngine: FinancialStatementsEngine;

  constructor(
    prisma: PrismaClient,
    openaiApiKey: string
  ) {
    this.prisma = prisma;
    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    });
    this.financialAnalysisEngine = new FinancialAnalysisEngine(prisma);
    this.financialStatementsEngine = new FinancialStatementsEngine(prisma);
  }

  async askFinancialQuestion(question: FinancialQuestion): Promise<FinancialAnswer> {
    try {
      logger.info(`Processing financial question: ${question.question} for business: ${question.businessAccountId}`);

      // Step 1: Gather relevant financial data
      const financialData = await this.gatherFinancialData(question);
      
      // Step 2: Determine what functions to call based on the question
      const requiredFunctions = await this.analyzeQuestionRequirements(question);
      
      // Step 3: Execute required functions to get data
      const functionResults = await this.executeFinancialFunctions(requiredFunctions, question);
      
      // Step 4: Generate AI interpretation
      const answer = await this.generateAIInterpretation(question, functionResults, financialData);
      
      // Step 5: Store the interaction for learning
      await this.storeInteraction(question, answer);

      return answer;
    } catch (error) {
      logger.error('Failed to process financial question:', error);
      throw error;
    }
  }

  private async gatherFinancialData(question: FinancialQuestion): Promise<any> {
    const { businessAccountId, context } = question;
    const fiscalYear = context?.fiscalYear || new Date().getFullYear();
    const fiscalQuarter = context?.fiscalQuarter;
    const analysisType = context?.analysisType;

    const data: any = {};

    try {
      // Get recent financial analysis results
      const analysisResults = await this.financialAnalysisEngine.getAnalysisResults(businessAccountId, {
        fiscalYear,
        fiscalQuarter,
        analysisType
      });
      data.analysisResults = analysisResults;

      // Get actual financial statements
      if (analysisType !== 'FORECAST') {
        const incomeStatement = await this.financialStatementsEngine.generateIncomeStatement(
          businessAccountId,
          fiscalYear,
          fiscalQuarter
        );
        const balanceSheet = await this.financialStatementsEngine.generateBalanceSheet(
          businessAccountId,
          fiscalYear,
          fiscalQuarter
        );
        const cashFlow = await this.financialStatementsEngine.generateCashFlowStatement(
          businessAccountId,
          fiscalYear,
          fiscalQuarter
        );
        
        data.actualStatements = {
          incomeStatement,
          balanceSheet,
          cashFlow
        };
      }

      // Get business account info
      const businessAccount = await this.prisma.businessAccount.findUnique({
        where: { id: businessAccountId },
        include: {
          industry: true
        }
      });
      data.businessInfo = businessAccount;

      return data;
    } catch (error) {
      logger.error('Failed to gather financial data:', error);
      return {};
    }
  }

  private async analyzeQuestionRequirements(question: FinancialQuestion): Promise<FinancialFunction[]> {
    const systemPrompt = this.getSystemPrompt(question.language);
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Analyze this financial question and determine what data/functions are needed: "${question.question}"

Available functions:
- get_financial_ratios: Get profitability, liquidity, leverage, and efficiency ratios
- get_common_size_statements: Get percentage-based income statement and balance sheet
- get_trend_analysis: Get trend data for key metrics over time
- get_forecast_vs_actual: Compare forecasted vs actual performance
- get_cash_flow_analysis: Analyze cash flow patterns and sources
- get_working_capital_analysis: Analyze working capital efficiency

Respond with a JSON array of required functions.`
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return [];
    }

    try {
      const parsed = JSON.parse(content);
      return parsed.functions || [];
    } catch (error) {
      logger.error('Failed to parse function requirements:', error);
      return [];
    }
  }

  private async executeFinancialFunctions(
    functions: FinancialFunction[],
    question: FinancialQuestion
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    const { businessAccountId, context } = question;
    const fiscalYear = context?.fiscalYear || new Date().getFullYear();
    const fiscalQuarter = context?.fiscalQuarter;

    for (const func of functions) {
      try {
        switch (func.name) {
          case 'get_financial_ratios':
            results.ratios = await this.financialAnalysisEngine.calculateFinancialRatios({
              businessAccountId,
              periodType: fiscalQuarter ? 'QUARTERLY' : 'YEARLY',
              fiscalYear,
              fiscalQuarter,
              dataSource: context?.analysisType === 'FORECAST' ? 'FORECAST' : 'ACTUAL'
            });
            break;

          case 'get_common_size_statements':
            results.commonSize = await this.financialAnalysisEngine.calculateCommonSizeStatements({
              businessAccountId,
              periodType: fiscalQuarter ? 'QUARTERLY' : 'YEARLY',
              fiscalYear,
              fiscalQuarter,
              dataSource: context?.analysisType === 'FORECAST' ? 'FORECAST' : 'ACTUAL'
            });
            break;

          case 'get_trend_analysis':
            results.trends = await this.financialAnalysisEngine.performAnalysis({
              businessAccountId,
              analysisType: 'TREND',
              periodType: 'YEARLY',
              fiscalYear,
              dataSource: 'ACTUAL'
            });
            break;

          case 'get_forecast_vs_actual':
            if (context?.scenarioId) {
              results.comparison = await this.financialAnalysisEngine.performAnalysis({
                businessAccountId,
                analysisType: 'COMPARISON',
                periodType: fiscalQuarter ? 'QUARTERLY' : 'YEARLY',
                fiscalYear,
                fiscalQuarter,
                scenarioId: context.scenarioId
              });
            }
            break;

          case 'get_cash_flow_analysis':
            results.cashFlow = await this.financialStatementsEngine.generateCashFlowStatement(
              businessAccountId,
              fiscalYear,
              fiscalQuarter
            );
            break;

          case 'get_working_capital_analysis':
            const balanceSheet = await this.financialStatementsEngine.generateBalanceSheet(
              businessAccountId,
              fiscalYear,
              fiscalQuarter
            );
            if (balanceSheet) {
              results.workingCapital = {
                currentAssets: balanceSheet.currentAssets,
                currentLiabilities: balanceSheet.currentLiabilities,
                workingCapital: balanceSheet.currentAssets - balanceSheet.currentLiabilities,
                workingCapitalRatio: balanceSheet.currentLiabilities > 0 
                  ? (balanceSheet.currentAssets - balanceSheet.currentLiabilities) / balanceSheet.currentLiabilities 
                  : 0
              };
            }
            break;
        }
      } catch (error) {
        logger.error(`Failed to execute function ${func.name}:`, error);
        results[func.name] = { error: error.message };
      }
    }

    return results;
  }

  private async generateAIInterpretation(
    question: FinancialQuestion,
    functionResults: Record<string, any>,
    financialData: any
  ): Promise<FinancialAnswer> {
    const systemPrompt = this.getInterpretationPrompt(question.language);
    
    const dataSummary = this.summarizeFinancialData(functionResults, financialData);
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Question: "${question.question}"

Financial Data:
${dataSummary}

Please provide a comprehensive financial analysis. Focus on interpreting the data, not calculating new values. Explain what the numbers mean, what trends you observe, what risks exist, and what actions might be recommended.

Respond in JSON format with this structure:
{
  "answer": "Main answer to the question",
  "confidence": 0.85,
  "sources": ["financial_ratios", "income_statement", "trend_analysis"],
  "relatedMetrics": ["current_ratio", "debt_to_equity", "profit_margin"],
  "followUpQuestions": ["What is driving the change in working capital?", "How does this compare to industry benchmarks?"],
  "explanation": {
    "what": "What the data shows",
    "why": "Why this is happening",
    "implications": "What this means for the business",
    "recommendations": ["Specific actionable recommendations"]
  }
}`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    try {
      const parsed = JSON.parse(content);
      return {
        ...parsed,
        language: question.language,
        sources: parsed.sources || [],
        relatedMetrics: parsed.relatedMetrics || [],
        followUpQuestions: parsed.followUpQuestions || [],
        explanation: parsed.explanation || {
          what: '',
          why: '',
          implications: '',
          recommendations: []
        }
      };
    } catch (error) {
      logger.error('Failed to parse AI response:', error);
      return {
        answer: content,
        language: question.language,
        confidence: 0.5,
        sources: [],
        relatedMetrics: [],
        followUpQuestions: [],
        explanation: {
          what: '',
          why: '',
          implications: '',
          recommendations: []
        }
      };
    }
  }

  private summarizeFinancialData(
    functionResults: Record<string, any>,
    financialData: any
  ): string {
    const summary: string[] = [];

    // Summarize ratios
    if (functionResults.ratios) {
      summary.push('Financial Ratios:');
      summary.push(`- Gross Profit Margin: ${functionResults.ratios.profitability?.grossProfitMargin?.toFixed(2)}%`);
      summary.push(`- Net Profit Margin: ${functionResults.ratios.profitability?.netProfitMargin?.toFixed(2)}%`);
      summary.push(`- Current Ratio: ${functionResults.ratios.liquidity?.currentRatio?.toFixed(2)}`);
      summary.push(`- Debt to Equity: ${functionResults.ratios.leverage?.debtToEquity?.toFixed(2)}`);
    }

    // Summarize common size
    if (functionResults.commonSize) {
      summary.push('\nCommon Size Analysis:');
      summary.push(`- Revenue as % of Total: 100%`);
      summary.push(`- COGS as % of Revenue: ${functionResults.commonSize.incomeStatement?.costOfGoodsSold?.toFixed(2)}%`);
      summary.push(`- Operating Expenses as % of Revenue: ${functionResults.commonSize.incomeStatement?.operatingExpenses?.toFixed(2)}%`);
    }

    // Summarize trends
    if (functionResults.trends?.trendAnalysis) {
      summary.push('\nTrend Analysis:');
      functionResults.trends.trendAnalysis.forEach((trend: any) => {
        summary.push(`- ${trend.metricName}: ${trend.trendDirection} (${trend.growthRate?.toFixed(2)}% growth)`);
      });
    }

    // Summarize actual statements
    if (financialData.actualStatements) {
      const { incomeStatement, balanceSheet } = financialData.actualStatements;
      if (incomeStatement) {
        summary.push('\nIncome Statement:');
        summary.push(`- Revenue: $${(incomeStatement.revenue || 0).toLocaleString()}`);
        summary.push(`- Net Income: $${(incomeStatement.netIncome || 0).toLocaleString()}`);
      }
      if (balanceSheet) {
        summary.push('\nBalance Sheet:');
        summary.push(`- Total Assets: $${(balanceSheet.totalAssets || 0).toLocaleString()}`);
        summary.push(`- Total Liabilities: $${(balanceSheet.totalLiabilities || 0).toLocaleString()}`);
        summary.push(`- Total Equity: $${(balanceSheet.totalEquity || 0).toLocaleString()}`);
      }
    }

    return summary.join('\n');
  }

  private getSystemPrompt(language: 'en' | 'ar'): string {
    if (language === 'ar') {
      return `أنت محاسب مالي خبير متخصص في تحليل البيانات المالية. مهمتك هي تحليل الأسئلة المالية وتحديد البيانات المطلوبة للإجابة عليها.

مبادئ توجيهية:
- أنت محلل، لا تحسب أرقام جديدة
- استخدم البيانات المتوفرة فقط
- ركز على تفسير الأرقام وليس حسابها
- كن دقيقاً ومفصلاً في تحليلك
- استخدم المصطلحات المالية العربية الصحيحة`;
    }

    return `You are an expert financial analyst specializing in interpreting financial data. Your task is to analyze financial questions and determine what data is needed to answer them.

Guiding principles:
- You are an interpreter, not a calculator
- Use only the provided data
- Focus on explaining what numbers mean, not calculating new ones
- Be precise and detailed in your analysis
- Use proper financial terminology`;
  }

  private getInterpretationPrompt(language: 'en' | 'ar'): string {
    if (language === 'ar') {
      return `أنت محلل مالي خبير يقوم بتفسير البيانات المالية. مهمتك هي الإجابة على الأسئلة المالية بناءً على البيانات المتوفرة فقط.

قواعد مهمة:
- لا تقم بحساب أي أرقام جديدة
- فسر فقط البيانات المتوفرة
- اشرح ما تعنيه الأرقام ولماذا هي مهمة
- حدد الاتجاهات والمخاطر والفرص
- قدم توصيات قابلة للتنفيذ
- استخدم لغة عربية احترافية وواضحة
- كن موضوعياً واستند إلى البيانات فقط`;
    }

    return `You are an expert financial analyst interpreting financial data. Your task is to answer financial questions based only on the provided data.

Important rules:
- Do not calculate any new numbers
- Only interpret the provided data
- Explain what the numbers mean and why they matter
- Identify trends, risks, and opportunities
- Provide actionable recommendations
- Use professional, clear language
- Be objective and data-driven`;
  }

  private async storeInteraction(
    question: FinancialQuestion,
    answer: FinancialAnswer
  ): Promise<void> {
    try {
      await this.prisma.aIAnalysis.create({
        data: {
          businessAccountId: question.businessAccountId,
          analysisType: 'FINANCIAL_QUESTION',
          query: question.question,
          result: JSON.stringify({
            question: question.question,
            answer: answer.answer,
            confidence: answer.confidence,
            sources: answer.sources,
            language: answer.language
          }),
          confidence: answer.confidence,
          metadata: JSON.stringify({
            context: question.context,
            relatedMetrics: answer.relatedMetrics,
            followUpQuestions: answer.followUpQuestions,
            explanation: answer.explanation
          })
        }
      });
    } catch (error) {
      logger.error('Failed to store AI interaction:', error);
    }
  }

  async getFinancialInsights(
    businessAccountId: string,
    language: 'en' | 'ar' = 'en'
  ): Promise<{
    keyInsights: string[];
    risks: string[];
    opportunities: string[];
    recommendations: string[];
  }> {
    try {
      // Get comprehensive financial data
      const analysisResults = await this.financialAnalysisEngine.getAnalysisResults(businessAccountId, {
        analysisType: 'RATIOS'
      });

      const latestAnalysis = analysisResults[0];
      if (!latestAnalysis?.financialRatios) {
        return {
          keyInsights: [],
          risks: [],
          opportunities: [],
          recommendations: []
        };
      }

      const ratios = latestAnalysis.financialRatios;
      const systemPrompt = this.getInsightsPrompt(language);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Based on these financial ratios, provide insights:

Profitability Ratios:
- Gross Profit Margin: ${ratios.profitability?.grossProfitMargin?.toFixed(2)}%
- Net Profit Margin: ${ratios.profitability?.netProfitMargin?.toFixed(2)}%
- Return on Assets: ${ratios.profitability?.returnOnAssets?.toFixed(2)}%
- Return on Equity: ${ratios.profitability?.returnOnEquity?.toFixed(2)}%

Liquidity Ratios:
- Current Ratio: ${ratios.liquidity?.currentRatio?.toFixed(2)}
- Quick Ratio: ${ratios.liquidity?.quickRatio?.toFixed(2)}
- Cash Ratio: ${ratios.liquidity?.cashRatio?.toFixed(2)}

Leverage Ratios:
- Debt to Equity: ${ratios.leverage?.debtToEquity?.toFixed(2)}
- Debt to Assets: ${ratios.leverage?.debtToAssets?.toFixed(2)}
- Interest Coverage: ${ratios.leverage?.interestCoverage?.toFixed(2)}

Asset Turnover Ratios:
- Asset Turnover: ${ratios.assetTurnover?.assetTurnover?.toFixed(2)}
- Inventory Turnover: ${ratios.assetTurnover?.inventoryTurnover?.toFixed(2)}
- Receivables Turnover: ${ratios.assetTurnover?.receivablesTurnover?.toFixed(2)}

Provide insights in JSON format:
{
  "keyInsights": ["Main observations about financial health"],
  "risks": ["Potential financial risks and concerns"],
  "opportunities": ["Areas for improvement and growth"],
  "recommendations": ["Specific actionable recommendations"]
}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      return JSON.parse(content);
    } catch (error) {
      logger.error('Failed to get financial insights:', error);
      return {
        keyInsights: [],
        risks: [],
        opportunities: [],
        recommendations: []
      };
    }
  }

  private getInsightsPrompt(language: 'en' | 'ar'): string {
    if (language === 'ar') {
      return `أنت محلل مالي خبير يقوم بتقييم الصحة المالية للشركة. قم بتحليل النسب المالية المتوفرة وتقديم رؤى قيمة.

ركز على:
- تحليل الاتجاهات والأنماط
- تحديد المخاطر المالية المحتملة
- اكتشاف فرص التحسين
- تقديم توصيات عملية وقابلة للتنفيذ
- استخدام لغة عربية احترافية`;
    }

    return `You are an expert financial analyst evaluating company financial health. Analyze the provided financial ratios and provide valuable insights.

Focus on:
- Analyzing trends and patterns
- Identifying potential financial risks
- Discovering improvement opportunities
- Providing practical, actionable recommendations
- Using professional financial terminology`;
  }

  async explainFinancialMetric(
    metricName: string,
    businessAccountId: string,
    language: 'en' | 'ar' = 'en'
  ): Promise<{
    definition: string;
    importance: string;
    interpretation: string;
    benchmarks: string;
  }> {
    try {
      // Get the specific metric value
      const analysisResults = await this.financialAnalysisEngine.getAnalysisResults(businessAccountId, {
        analysisType: 'RATIOS'
      });

      const latestAnalysis = analysisResults[0];
      let metricValue = null;

      if (latestAnalysis?.financialRatios) {
        const ratios = latestAnalysis.financialRatios;
        metricValue = this.extractMetricValue(ratios, metricName);
      }

      const systemPrompt = language === 'ar' 
        ? 'أنت خبير مالي يقوم بشرح المقاييس المالية بطريقة واضحة ومفهومة.'
        : 'You are a financial expert explaining financial metrics clearly and understandably.';

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: language === 'ar' ? `
اشرح مقياس ${metricName} ${metricValue ? `بالقيمة ${metricValue}` : ''}.

قدم الشرح بالصيغة التالية:
{
  "definition": "تعريف المقياس",
  "importance": "لماذا هذا المقياس مهم",
  "interpretation": "كيفية تفسير القيمة الحالية",
  "benchmarks": "المعايير المرجعية الصناعية"
}` : `
Explain the financial metric ${metricName} ${metricValue ? `with a value of ${metricValue}` : ''}.

Provide the explanation in this format:
{
  "definition": "What the metric measures",
  "importance": "Why this metric matters",
  "interpretation": "How to interpret the current value",
  "benchmarks": "Industry benchmarks and standards"
}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      return JSON.parse(content);
    } catch (error) {
      logger.error('Failed to explain financial metric:', error);
      return {
        definition: '',
        importance: '',
        interpretation: '',
        benchmarks: ''
      };
    }
  }

  private extractMetricValue(ratios: any, metricName: string): string | null {
    const metricMap: Record<string, string> = {
      'gross_profit_margin': ratios.profitability?.grossProfitMargin?.toString(),
      'net_profit_margin': ratios.profitability?.netProfitMargin?.toString(),
      'return_on_assets': ratios.profitability?.returnOnAssets?.toString(),
      'return_on_equity': ratios.profitability?.returnOnEquity?.toString(),
      'current_ratio': ratios.liquidity?.currentRatio?.toString(),
      'quick_ratio': ratios.liquidity?.quickRatio?.toString(),
      'cash_ratio': ratios.liquidity?.cashRatio?.toString(),
      'debt_to_equity': ratios.leverage?.debtToEquity?.toString(),
      'debt_to_assets': ratios.leverage?.debtToAssets?.toString(),
      'interest_coverage': ratios.leverage?.interestCoverage?.toString(),
      'asset_turnover': ratios.assetTurnover?.assetTurnover?.toString(),
      'inventory_turnover': ratios.assetTurnover?.inventoryTurnover?.toString(),
      'receivables_turnover': ratios.assetTurnover?.receivablesTurnover?.toString()
    };

    return metricMap[metricName.toLowerCase()] || null;
  }
}
