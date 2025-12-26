// Agent Controller - متحكم الموظفين

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const agentController = {
  async getAgents(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const where: any = {};
      
      if (status) where.status = status;

      const agents = await prisma.agent.findMany({
        where,
        orderBy: { avgRating: 'desc' },
      });

      res.json({ success: true, data: agents });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getAgent(req: Request, res: Response) {
    try {
      const agent = await prisma.agent.findUnique({
        where: { id: req.params.agentId },
      });

      if (!agent) {
        return res.status(404).json({ success: false, error: 'Agent not found', errorAr: 'الموظف غير موجود' });
      }

      res.json({ success: true, data: agent });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async createAgent(req: Request, res: Response) {
    try {
      const { userId, name, email, avatar, languages, specializations, maxConcurrent } = req.body;

      const agent = await prisma.agent.create({
        data: {
          userId,
          name,
          email,
          avatar,
          languages: languages || ['ar', 'en'],
          specializations: specializations || [],
          maxConcurrent: maxConcurrent || 5,
        },
      });

      res.status(201).json({ success: true, data: agent, message: 'Agent created', messageAr: 'تم إنشاء الموظف' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateAgent(req: Request, res: Response) {
    try {
      const { name, email, avatar, languages, specializations, maxConcurrent } = req.body;

      const agent = await prisma.agent.update({
        where: { id: req.params.agentId },
        data: { name, email, avatar, languages, specializations, maxConcurrent },
      });

      res.json({ success: true, data: agent, message: 'Agent updated', messageAr: 'تم تحديث الموظف' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;

      const agent = await prisma.agent.update({
        where: { id: req.params.agentId },
        data: { status },
      });

      res.json({ success: true, data: agent, message: 'Status updated', messageAr: 'تم تحديث الحالة' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getAgentStats(req: Request, res: Response) {
    try {
      const agent = await prisma.agent.findUnique({
        where: { id: req.params.agentId },
      });

      if (!agent) {
        return res.status(404).json({ success: false, error: 'Agent not found', errorAr: 'الموظف غير موجود' });
      }

      // Get conversation stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [todayChats, totalResolved] = await Promise.all([
        prisma.conversation.count({
          where: { escalatedTo: agent.id, createdAt: { gte: today } },
        }),
        prisma.conversation.count({
          where: { escalatedTo: agent.id, status: 'RESOLVED' },
        }),
      ]);

      res.json({
        success: true,
        data: {
          agent,
          stats: {
            todayChats,
            totalChats: agent.totalChats,
            totalResolved,
            avgRating: agent.avgRating,
            avgResponseTime: agent.avgResponseTime,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
