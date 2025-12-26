// Analytics Controller - متحكم التحليلات

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const analyticsController = {
  async getDashboard(req: Request, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [todayStats, activeConversations, onlineAgents, recentConversations] = await Promise.all([
        prisma.chatAnalytics.findUnique({ where: { date: today } }),
        prisma.conversation.count({ where: { status: 'ACTIVE' } }),
        prisma.agent.count({ where: { status: 'ONLINE' } }),
        prisma.conversation.findMany({
          take: 10,
          orderBy: { updatedAt: 'desc' },
          include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
        }),
      ]);

      res.json({
        success: true,
        data: {
          today: todayStats || { totalMessages: 0, totalConversations: 0 },
          activeConversations,
          onlineAgents,
          recentConversations,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getMetrics(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const analytics = await prisma.chatAnalytics.findMany({
        where: { date: { gte: start, lte: end } },
        orderBy: { date: 'asc' },
      });

      // Calculate totals
      const totals = analytics.reduce(
        (acc, day) => ({
          totalMessages: acc.totalMessages + day.totalMessages,
          totalConversations: acc.totalConversations + day.totalConversations,
          resolvedByBot: acc.resolvedByBot + day.resolvedByBot,
          escalatedToAgent: acc.escalatedToAgent + day.escalatedToAgent,
          positiveSentiment: acc.positiveSentiment + day.positiveSentiment,
          negativeSentiment: acc.negativeSentiment + day.negativeSentiment,
        }),
        { totalMessages: 0, totalConversations: 0, resolvedByBot: 0, escalatedToAgent: 0, positiveSentiment: 0, negativeSentiment: 0 }
      );

      const botResolutionRate = totals.totalConversations > 0 
        ? (totals.resolvedByBot / totals.totalConversations * 100).toFixed(1) 
        : 0;

      res.json({
        success: true,
        data: {
          daily: analytics,
          totals,
          botResolutionRate: `${botResolutionRate}%`,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getIntentStats(req: Request, res: Response) {
    try {
      const intents = await prisma.intent.findMany({
        where: { isEnabled: true },
        orderBy: { matchCount: 'desc' },
        take: 20,
        select: { name: true, nameAr: true, category: true, matchCount: true, minConfidence: true },
      });

      const totalMatches = intents.reduce((sum, i) => sum + i.matchCount, 0);

      const intentStats = intents.map(intent => ({
        ...intent,
        percentage: totalMatches > 0 ? ((intent.matchCount / totalMatches) * 100).toFixed(1) : 0,
      }));

      res.json({ success: true, data: intentStats, totalMatches });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getSentimentStats(req: Request, res: Response) {
    try {
      const { days = '30' } = req.query;
      const startDate = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);

      const analytics = await prisma.chatAnalytics.findMany({
        where: { date: { gte: startDate } },
      });

      const totals = analytics.reduce(
        (acc, day) => ({
          positive: acc.positive + day.positiveSentiment,
          neutral: acc.neutral + day.neutralSentiment,
          negative: acc.negative + day.negativeSentiment,
        }),
        { positive: 0, neutral: 0, negative: 0 }
      );

      const total = totals.positive + totals.neutral + totals.negative;

      res.json({
        success: true,
        data: {
          totals,
          percentages: {
            positive: total > 0 ? ((totals.positive / total) * 100).toFixed(1) : 0,
            neutral: total > 0 ? ((totals.neutral / total) * 100).toFixed(1) : 0,
            negative: total > 0 ? ((totals.negative / total) * 100).toFixed(1) : 0,
          },
          trend: analytics.map(day => ({
            date: day.date,
            positive: day.positiveSentiment,
            neutral: day.neutralSentiment,
            negative: day.negativeSentiment,
          })),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
