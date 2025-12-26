// Event Controller - متحكم الأحداث

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const eventController = {
  async getEvents(req: Request, res: Response) {
    try {
      const { showroomId, status } = req.query;
      const events = await prisma.vREvent.findMany({
        where: {
          ...(showroomId && { showroomId: showroomId as string }),
          ...(status && { status: status as any }),
        },
        orderBy: { startTime: 'asc' },
      });
      res.json({ success: true, data: events });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getEvent(req: Request, res: Response) {
    try {
      const event = await prisma.vREvent.findUnique({
        where: { id: req.params.eventId },
        include: { registrations: true },
      });
      if (!event) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }
      res.json({ success: true, data: event });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async createEvent(req: Request, res: Response) {
    try {
      const event = await prisma.vREvent.create({ data: req.body });
      res.status(201).json({ success: true, data: event, message: 'Event created', messageAr: 'تم إنشاء الحدث' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateEvent(req: Request, res: Response) {
    try {
      const event = await prisma.vREvent.update({
        where: { id: req.params.eventId },
        data: req.body,
      });
      res.json({ success: true, data: event });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async registerForEvent(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      const registration = await prisma.eventRegistration.create({
        data: { eventId: req.params.eventId, userId },
      });
      await prisma.vREvent.update({
        where: { id: req.params.eventId },
        data: { currentAttendees: { increment: 1 } },
      });
      res.status(201).json({ success: true, data: registration, message: 'Registered', messageAr: 'تم التسجيل' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async unregisterFromEvent(req: Request, res: Response) {
    try {
      await prisma.eventRegistration.delete({
        where: { eventId_userId: { eventId: req.params.eventId, userId: req.params.userId } },
      });
      await prisma.vREvent.update({
        where: { id: req.params.eventId },
        data: { currentAttendees: { decrement: 1 } },
      });
      res.json({ success: true, message: 'Unregistered', messageAr: 'تم إلغاء التسجيل' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async startEvent(req: Request, res: Response) {
    try {
      const event = await prisma.vREvent.update({
        where: { id: req.params.eventId },
        data: { status: 'LIVE' },
      });
      res.json({ success: true, data: event, message: 'Event started', messageAr: 'بدأ الحدث' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async endEvent(req: Request, res: Response) {
    try {
      const event = await prisma.vREvent.update({
        where: { id: req.params.eventId },
        data: { status: 'ENDED' },
      });
      res.json({ success: true, data: event, message: 'Event ended', messageAr: 'انتهى الحدث' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
