// Avatar Controller - متحكم الأفاتار

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const avatarController = {
  async getAvatar(req: Request, res: Response) {
    try {
      let avatar = await prisma.vRAvatar.findUnique({ where: { userId: req.params.userId } });
      if (!avatar) {
        avatar = await prisma.vRAvatar.create({ data: { userId: req.params.userId } });
      }
      res.json({ success: true, data: avatar });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async createAvatar(req: Request, res: Response) {
    try {
      const avatar = await prisma.vRAvatar.create({ data: req.body });
      res.status(201).json({ success: true, data: avatar });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateAvatar(req: Request, res: Response) {
    try {
      const avatar = await prisma.vRAvatar.upsert({
        where: { userId: req.params.userId },
        update: req.body,
        create: { userId: req.params.userId, ...req.body },
      });
      res.json({ success: true, data: avatar, message: 'Avatar updated', messageAr: 'تم تحديث الأفاتار' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
