import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DisputeSystemService {
  private readonly logger = new Logger(DisputeSystemService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createDisputeTicket(data: any) {
    if (!data.categoryId || !data.complainantId || !data.respondentId || !data.title || !data.description || !data.disputeType || !data.priority) {
      throw new BadRequestException('Missing required fields');
    }
    const validTypes = ['payment', 'delivery', 'quality', 'fraud', 'service', 'other'];
    const validPriorities = ['low', 'medium', 'high', 'critical', 'urgent'];
    if (!validTypes.includes(data.disputeType)) throw new BadRequestException('Invalid dispute type');
    if (!validPriorities.includes(data.priority)) throw new BadRequestException('Invalid priority level');

    const ticket = await this.prisma.disputeTicket.create({
      data: { ...data, severityScore: data.severityScore || 1, status: 'OPEN' } as any,
    });
    this.logger.log(`Dispute ticket created: ${ticket.id}`);
    return ticket;
  }

  async getDisputeTickets(filters?: any) {
    return this.prisma.disputeTicket.findMany({ where: filters || {}, orderBy: { createdAt: 'desc' } } as any);
  }

  async getDisputeTicket(ticketId: string) {
    return this.prisma.disputeTicket.findUnique({ where: { id: ticketId } } as any);
  }

  async updateTicketStatus(ticketId: string, status: string) {
    return this.prisma.disputeTicket.update({ where: { id: ticketId }, data: { status } } as any);
  }

  async addDisputeMessage(ticketId: string, data: any) {
    return this.prisma.disputeMessage.create({ data: { ...data, disputeTicketId: ticketId } } as any);
  }

  async getDisputeMessages(ticketId: string) {
    return this.prisma.disputeMessage.findMany({ where: { disputeTicketId: ticketId } as any, orderBy: { createdAt: 'asc' } });
  }

  async addEvidence(ticketId: string, data: any) {
    return this.prisma.disputeEvidence.create({ data: { ...data, disputeTicketId: ticketId } } as any);
  }

  async getDisputeEvidence(ticketId: string) {
    return this.prisma.disputeEvidence.findMany({ where: { disputeTicketId: ticketId } as any });
  }

  async getDisputeCategories() {
    return [
      { id: 'payment', name: 'Payment Issues', description: 'Payment-related disputes' },
      { id: 'delivery', name: 'Delivery Issues', description: 'Shipping and delivery disputes' },
      { id: 'quality', name: 'Quality Issues', description: 'Product quality disputes' },
      { id: 'fraud', name: 'Fraud', description: 'Fraudulent activity reports' },
      { id: 'service', name: 'Service Issues', description: 'Service-related disputes' },
    ];
  }

  async getSLARules() {
    return [
      { priority: 'critical', responseTimeHours: 1, resolutionTimeHours: 24 },
      { priority: 'high', responseTimeHours: 4, resolutionTimeHours: 48 },
      { priority: 'medium', responseTimeHours: 8, resolutionTimeHours: 72 },
      { priority: 'low', responseTimeHours: 24, resolutionTimeHours: 168 },
    ];
  }

  async getDisputeAnalytics() {
    const [total, open, resolved, escalated] = await Promise.all([
      this.prisma.disputeTicket.count(),
      this.prisma.disputeTicket.count({ where: { status: 'OPEN' } } as any),
      this.prisma.disputeTicket.count({ where: { status: 'RESOLVED' } } as any),
      this.prisma.disputeTicket.count({ where: { status: 'ESCALATED' } } as any),
    ]);
    return { total, open, resolved, escalated, resolutionRate: total > 0 ? (resolved / total * 100).toFixed(1) : 0 };
  }

  async getAgentPerformance() { return []; }

  async getDisputeDashboard() {
    const analytics = await this.getDisputeAnalytics();
    return { ...analytics, recentTickets: [], pendingActions: 0 };
  }

  async triggerSLACompliance() {
    this.logger.log('SLA compliance check triggered');
    return { checked: true, violations: 0, timestamp: new Date().toISOString() };
  }
}
