// Sentiment Analysis Service - Gen 10 AI
// خدمة تحليل المشاعر - الجيل العاشر

import { PrismaClient, SentimentSource, SentimentType } from '@prisma/client';
import OpenAI from 'openai';
import Sentiment from 'sentiment';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const sentimentAnalyzer = new Sentiment();

interface SentimentResult {
  sentiment: SentimentType;
  score: number;
  magnitude: number;
  emotions: {
    joy: number;
    anger: number;
    sadness: number;
    fear: number;
    surprise: number;
  };
  keywords: string[];
  topics: string[];
}

export class SentimentService {
  // Analyze text sentiment
  async analyzeText(data: {
    text: string;
    sourceType: SentimentSource;
    sourceId: string;
    userId?: string;
    language?: string;
  }): Promise<SentimentResult & { id: string }> {
    const language = data.language || await this.detectLanguage(data.text);
    
    // Use multiple analysis methods for accuracy
    const [basicAnalysis, aiAnalysis] = await Promise.all([
      this.basicSentimentAnalysis(data.text),
      this.aiSentimentAnalysis(data.text, language)
    ]);

    // Combine results with weighted average
    const combinedScore = (basicAnalysis.score * 0.3 + aiAnalysis.score * 0.7);
    const sentiment = this.scoreToSentiment(combinedScore);

    // Save analysis
    const saved = await prisma.sentimentAnalysis.create({
      data: {
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        userId: data.userId,
        text: data.text,
        language,
        sentiment,
        score: combinedScore,
        magnitude: aiAnalysis.magnitude,
        emotions: aiAnalysis.emotions,
        keywords: aiAnalysis.keywords,
        topics: aiAnalysis.topics
      }
    });

    return {
      id: saved.id,
      sentiment,
      score: combinedScore,
      magnitude: aiAnalysis.magnitude,
      emotions: aiAnalysis.emotions,
      keywords: aiAnalysis.keywords,
      topics: aiAnalysis.topics
    };
  }

  // Basic sentiment analysis using sentiment library
  private basicSentimentAnalysis(text: string) {
    const result = sentimentAnalyzer.analyze(text);
    // Normalize score to -1 to 1 range
    const normalizedScore = Math.max(-1, Math.min(1, result.comparative));
    
    return {
      score: normalizedScore,
      words: result.words,
      positive: result.positive,
      negative: result.negative
    };
  }

  // AI-powered sentiment analysis
  private async aiSentimentAnalysis(text: string, language: string) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a sentiment analysis expert. Analyze the following text and return a JSON object with:
- score: number from -1 (very negative) to 1 (very positive)
- magnitude: number from 0 to infinity indicating emotional intensity
- emotions: object with joy, anger, sadness, fear, surprise (each 0-1)
- keywords: array of important keywords
- topics: array of main topics discussed
Return ONLY valid JSON.`
          },
          { role: 'user', content: text }
        ],
        temperature: 0,
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      return {
        score: result.score || 0,
        magnitude: result.magnitude || 0,
        emotions: result.emotions || { joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0 },
        keywords: result.keywords || [],
        topics: result.topics || []
      };
    } catch (error) {
      console.error('AI Sentiment Analysis Error:', error);
      return {
        score: 0,
        magnitude: 0,
        emotions: { joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0 },
        keywords: [],
        topics: []
      };
    }
  }

  // Batch analyze multiple texts
  async batchAnalyze(items: Array<{
    text: string;
    sourceType: SentimentSource;
    sourceId: string;
    userId?: string;
  }>) {
    const results = await Promise.all(
      items.map(item => this.analyzeText(item))
    );

    return {
      total: results.length,
      results,
      summary: this.summarizeBatch(results)
    };
  }

  // Analyze reviews for a product
  async analyzeProductReviews(productId: string) {
    const analyses = await prisma.sentimentAnalysis.findMany({
      where: {
        sourceType: 'REVIEW',
        sourceId: productId
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!analyses.length) {
      return {
        productId,
        totalReviews: 0,
        averageSentiment: 0,
        sentimentDistribution: { positive: 0, negative: 0, neutral: 0, mixed: 0 }
      };
    }

    const distribution = {
      positive: analyses.filter(a => a.sentiment === 'POSITIVE').length,
      negative: analyses.filter(a => a.sentiment === 'NEGATIVE').length,
      neutral: analyses.filter(a => a.sentiment === 'NEUTRAL').length,
      mixed: analyses.filter(a => a.sentiment === 'MIXED').length
    };

    const avgScore = analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length;

    // Extract common keywords and topics
    const allKeywords = analyses.flatMap(a => a.keywords);
    const allTopics = analyses.flatMap(a => a.topics);
    
    const topKeywords = this.getTopItems(allKeywords, 10);
    const topTopics = this.getTopItems(allTopics, 5);

    return {
      productId,
      totalReviews: analyses.length,
      averageSentiment: avgScore,
      sentimentDistribution: distribution,
      topKeywords,
      topTopics,
      recentTrend: this.calculateTrend(analyses)
    };
  }


  // Analyze seller reputation
  async analyzeSellerReputation(sellerId: string) {
    const analyses = await prisma.sentimentAnalysis.findMany({
      where: {
        sourceType: 'FEEDBACK',
        sourceId: sellerId
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    if (!analyses.length) {
      return {
        sellerId,
        reputationScore: 0.5,
        totalFeedback: 0,
        recommendation: 'Not enough data',
        recommendationAr: 'لا توجد بيانات كافية'
      };
    }

    const avgScore = analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length;
    const normalizedScore = (avgScore + 1) / 2; // Convert -1,1 to 0,1

    let recommendation = '';
    let recommendationAr = '';

    if (normalizedScore >= 0.8) {
      recommendation = 'Highly recommended seller';
      recommendationAr = 'بائع موصى به بشدة';
    } else if (normalizedScore >= 0.6) {
      recommendation = 'Good seller';
      recommendationAr = 'بائع جيد';
    } else if (normalizedScore >= 0.4) {
      recommendation = 'Average seller';
      recommendationAr = 'بائع متوسط';
    } else {
      recommendation = 'Exercise caution';
      recommendationAr = 'توخى الحذر';
    }

    return {
      sellerId,
      reputationScore: normalizedScore,
      totalFeedback: analyses.length,
      recommendation,
      recommendationAr,
      trend: this.calculateTrend(analyses)
    };
  }

  // Real-time sentiment monitoring
  async monitorSentiment(sourceType: SentimentSource, timeWindow = 60) {
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - timeWindow);

    const analyses = await prisma.sentimentAnalysis.findMany({
      where: {
        sourceType,
        createdAt: { gte: startTime }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = analyses.length;
    const avgScore = total ? analyses.reduce((sum, a) => sum + a.score, 0) / total : 0;

    // Detect anomalies
    const anomalies = this.detectAnomalies(analyses);

    return {
      sourceType,
      timeWindow,
      total,
      averageSentiment: avgScore,
      distribution: {
        positive: analyses.filter(a => a.sentiment === 'POSITIVE').length,
        negative: analyses.filter(a => a.sentiment === 'NEGATIVE').length,
        neutral: analyses.filter(a => a.sentiment === 'NEUTRAL').length
      },
      anomalies,
      alert: avgScore < -0.3 ? 'Negative sentiment spike detected' : null,
      alertAr: avgScore < -0.3 ? 'تم اكتشاف ارتفاع في المشاعر السلبية' : null
    };
  }

  // Detect language
  private async detectLanguage(text: string): Promise<string> {
    const arabicPattern = /[\u0600-\u06FF]/;
    if (arabicPattern.test(text)) return 'ar';
    return 'en';
  }

  // Convert score to sentiment type
  private scoreToSentiment(score: number): SentimentType {
    if (score >= 0.3) return 'POSITIVE';
    if (score <= -0.3) return 'NEGATIVE';
    if (Math.abs(score) < 0.1) return 'NEUTRAL';
    return 'MIXED';
  }

  // Summarize batch results
  private summarizeBatch(results: SentimentResult[]) {
    const total = results.length;
    if (!total) return null;

    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / total;
    const distribution = {
      positive: results.filter(r => r.sentiment === 'POSITIVE').length,
      negative: results.filter(r => r.sentiment === 'NEGATIVE').length,
      neutral: results.filter(r => r.sentiment === 'NEUTRAL').length,
      mixed: results.filter(r => r.sentiment === 'MIXED').length
    };

    return {
      averageScore: avgScore,
      distribution,
      dominantSentiment: this.scoreToSentiment(avgScore)
    };
  }

  // Get top items by frequency
  private getTopItems(items: string[], limit: number): Array<{ item: string; count: number }> {
    const counts = new Map<string, number>();
    items.forEach(item => {
      counts.set(item, (counts.get(item) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item, count]) => ({ item, count }));
  }

  // Calculate sentiment trend
  private calculateTrend(analyses: any[]): string {
    if (analyses.length < 5) return 'insufficient_data';

    const recent = analyses.slice(0, Math.floor(analyses.length / 2));
    const older = analyses.slice(Math.floor(analyses.length / 2));

    const recentAvg = recent.reduce((sum, a) => sum + a.score, 0) / recent.length;
    const olderAvg = older.reduce((sum, a) => sum + a.score, 0) / older.length;

    const diff = recentAvg - olderAvg;
    if (diff > 0.1) return 'improving';
    if (diff < -0.1) return 'declining';
    return 'stable';
  }

  // Detect anomalies in sentiment
  private detectAnomalies(analyses: any[]): any[] {
    if (analyses.length < 10) return [];

    const scores = analyses.map(a => a.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const stdDev = Math.sqrt(
      scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length
    );

    return analyses
      .filter(a => Math.abs(a.score - mean) > 2 * stdDev)
      .map(a => ({
        id: a.id,
        score: a.score,
        deviation: Math.abs(a.score - mean) / stdDev
      }));
  }

  // Get sentiment history
  async getSentimentHistory(sourceType: SentimentSource, sourceId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analyses = await prisma.sentimentAnalysis.findMany({
      where: {
        sourceType,
        sourceId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by day
    const dailyData = new Map<string, number[]>();
    analyses.forEach(a => {
      const day = a.createdAt.toISOString().split('T')[0];
      if (!dailyData.has(day)) dailyData.set(day, []);
      dailyData.get(day)!.push(a.score);
    });

    const history = Array.from(dailyData.entries()).map(([date, scores]) => ({
      date,
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      count: scores.length
    }));

    return {
      sourceType,
      sourceId,
      days,
      history,
      overallTrend: this.calculateTrend(analyses)
    };
  }
}

export const sentimentService = new SentimentService();
