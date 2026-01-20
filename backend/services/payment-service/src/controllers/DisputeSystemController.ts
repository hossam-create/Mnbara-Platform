import { Request, Response } from 'express';
import { DisputeSystemService } from '../services/DisputeSystemService';

export class DisputeSystemController {
  private disputeService: DisputeSystemService;

  constructor() {
    this.disputeService = new DisputeSystemService();
    // Initialize the service
    this.disputeService.initialize();
  }

  /**
   * Create new dispute ticket
   */
  createDisputeTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        disputeId,
        categoryId,
        complainantId,
        respondentId,
        title,
        description,
        disputeType,
        priority,
        severityScore,
        disputedAmount,
        currency,
        compensationRequested,
      } = req.body;

      if (!categoryId || !complainantId || !respondentId || !title || !description || !disputeType || !priority) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const validDisputeTypes = ['payment', 'delivery', 'quality', 'fraud', 'service', 'other'];
      const validPriorities = ['low', 'medium', 'high', 'critical', 'urgent'];

      if (!validDisputeTypes.includes(disputeType)) {
        res.status(400).json({ error: 'Invalid dispute type' });
        return;
      }

      if (!validPriorities.includes(priority)) {
        res.status(400).json({ error: 'Invalid priority level' });
        return;
      }

      const ticket = await this.disputeService.createDisputeTicket({
        disputeId,
        categoryId,
        complainantId,
        respondentId,
        title,
        description,
        disputeType,
        priority,
        severityScore: severityScore || 1,
        disputedAmount,
        currency: currency || 'USD',
        compensationRequested,
      });

      res.status(201).json({
        success: true,
        data: ticket,
        message: 'Dispute ticket created successfully',
      });
    } catch (error) {
      console.error('Create dispute ticket error:', error);
      res.status(500).json({ 
        error: 'Failed to create dispute ticket',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get dispute tickets with filters
   */
  getDisputeTickets = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        status,
        priority,
        assignedAgentId,
        complainantId,
        categoryId,
        startDate,
        endDate,
        limit = '50',
        offset = '0',
      } = req.query;

      const filters = {
        status: status as string,
        priority: priority as string,
        assignedAgentId: assignedAgentId as string,
        complainantId: complainantId as string,
        categoryId: categoryId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const tickets = await this.disputeService.getDisputeTickets(filters);

      res.status(200).json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      console.error('Get dispute tickets error:', error);
      res.status(500).json({ 
        error: 'Failed to get dispute tickets',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get dispute ticket by ID
   */
  getDisputeTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticketId } = req.params;

      if (!ticketId) {
        res.status(400).json({ error: 'Ticket ID is required' });
        return;
      }

      const tickets = await this.disputeService.getDisputeTickets({ 
        limit: 1, 
        offset: 0 
      });
      
      const ticket = tickets.find(t => t.id === ticketId);

      if (!ticket) {
        res.status(404).json({ error: 'Dispute ticket not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      console.error('Get dispute ticket error:', error);
      res.status(500).json({ 
        error: 'Failed to get dispute ticket',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Update dispute ticket status
   */
  updateTicketStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticketId } = req.params;
      const { status, subStatus, assignedAgentId, escalationLevel } = req.body;

      if (!ticketId || !status) {
        res.status(400).json({ error: 'Ticket ID and status are required' });
        return;
      }

      const validStatuses = ['open', 'investigating', 'mediating', 'escalated', 'resolved', 'closed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }

      const updatedTicket = await this.disputeService.updateTicketStatus(
        ticketId,
        status,
        subStatus,
        assignedAgentId,
        escalationLevel
      );

      res.status(200).json({
        success: true,
        data: updatedTicket,
        message: 'Ticket status updated successfully',
      });
    } catch (error) {
      console.error('Update ticket status error:', error);
      res.status(500).json({ 
        error: 'Failed to update ticket status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Add message to dispute ticket
   */
  addDisputeMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticketId } = req.params;
      const {
        senderId,
        senderType,
        messageType,
        content,
        isInternal = false,
        isVisibleToCustomer = true,
      } = req.body;

      if (!ticketId || !senderId || !senderType || !messageType || !content) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const validSenderTypes = ['complainant', 'respondent', 'agent', 'system', 'mediator'];
      const validMessageTypes = ['message', 'evidence', 'note', 'system_update', 'escalation'];

      if (!validSenderTypes.includes(senderType)) {
        res.status(400).json({ error: 'Invalid sender type' });
        return;
      }

      if (!validMessageTypes.includes(messageType)) {
        res.status(400).json({ error: 'Invalid message type' });
        return;
      }

      const message = await this.disputeService.addDisputeMessage(
        ticketId,
        senderId,
        senderType,
        messageType,
        content,
        isInternal,
        isVisibleToCustomer
      );

      res.status(201).json({
        success: true,
        data: message,
        message: 'Message added successfully',
      });
    } catch (error) {
      console.error('Add dispute message error:', error);
      res.status(500).json({ 
        error: 'Failed to add message',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get dispute messages for ticket
   */
  getDisputeMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticketId } = req.params;
      const { includeInternal = 'false' } = req.query;

      if (!ticketId) {
        res.status(400).json({ error: 'Ticket ID is required' });
        return;
      }

      const messages = await this.disputeService.getDisputeMessages(
        ticketId,
        includeInternal === 'true'
      );

      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error('Get dispute messages error:', error);
      res.status(500).json({ 
        error: 'Failed to get messages',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Add evidence to dispute
   */
  addEvidence = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticketId } = req.params;
      const {
        submittedById,
        evidenceType,
        fileName,
        filePath,
        fileSize,
        fileType,
        description,
      } = req.body;

      if (!ticketId || !submittedById || !evidenceType || !fileName || !filePath) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const validEvidenceTypes = ['document', 'image', 'video', 'audio', 'screenshot', 'chat_log', 'email', 'other'];
      if (!validEvidenceTypes.includes(evidenceType)) {
        res.status(400).json({ error: 'Invalid evidence type' });
        return;
      }

      const evidence = await this.disputeService.addEvidence(
        ticketId,
        submittedById,
        evidenceType,
        fileName,
        filePath,
        fileSize || 0,
        fileType || 'application/octet-stream',
        description
      );

      res.status(201).json({
        success: true,
        data: evidence,
        message: 'Evidence added successfully',
      });
    } catch (error) {
      console.error('Add evidence error:', error);
      res.status(500).json({ 
        error: 'Failed to add evidence',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get dispute evidence
   */
  getDisputeEvidence = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticketId } = req.params;

      if (!ticketId) {
        res.status(400).json({ error: 'Ticket ID is required' });
        return;
      }

      const evidence = await this.disputeService.getDisputeEvidence(ticketId);

      res.status(200).json({
        success: true,
        data: evidence,
      });
    } catch (error) {
      console.error('Get dispute evidence error:', error);
      res.status(500).json({ 
        error: 'Failed to get evidence',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get dispute categories
   */
  getDisputeCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const categories = await this.disputeService.getDisputeCategories();

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error('Get dispute categories error:', error);
      res.status(500).json({ 
        error: 'Failed to get dispute categories',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get SLA rules
   */
  getSLARules = async (req: Request, res: Response): Promise<void> => {
    try {
      const slaRules = await this.disputeService.getSLARules();

      res.status(200).json({
        success: true,
        data: slaRules,
      });
    } catch (error) {
      console.error('Get SLA rules error:', error);
      res.status(500).json({ 
        error: 'Failed to get SLA rules',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get dispute analytics
   */
  getDisputeAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      const analytics = await this.disputeService.getDisputeAnalytics(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error('Get dispute analytics error:', error);
      res.status(500).json({ 
        error: 'Failed to get dispute analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get agent performance
   */
  getAgentPerformance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { agentId, startDate, endDate } = req.query;

      const performance = await this.disputeService.getAgentPerformance(
        agentId as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: performance,
      });
    } catch (error) {
      console.error('Get agent performance error:', error);
      res.status(500).json({ 
        error: 'Failed to get agent performance',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Trigger SLA compliance check
   */
  triggerSLACompliance = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.disputeService.processSLACompliance();

      res.status(200).json({
        success: true,
        message: 'SLA compliance check triggered successfully',
      });
    } catch (error) {
      console.error('Trigger SLA compliance error:', error);
      res.status(500).json({ 
        error: 'Failed to trigger SLA compliance check',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get dispute dashboard data
   */
  getDisputeDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      // This would query the dispute_dashboard view
      // For now, return mock data
      const dashboardData = {
        summary: {
          totalDisputes: 156,
          openDisputes: 23,
          investigatingDisputes: 45,
          resolvedDisputes: 78,
          escalatedDisputes: 10,
          slaBreached: 3,
        },
        metrics: {
          avgFirstResponseHours: 2.3,
          avgResolutionHours: 24.5,
          slaComplianceRate: 96.8,
          customerSatisfactionScore: 4.2,
        },
        financials: {
          totalDisputedAmount: 45600.00,
          totalRefundedAmount: 28900.00,
          totalCompensationAmount: 3400.00,
        },
        recentActivity: [
          {
            type: 'dispute_created',
            ticketNumber: '240120001',
            priority: 'high',
            timestamp: new Date().toISOString(),
          },
          {
            type: 'sla_breach',
            ticketNumber: '240119015',
            priority: 'medium',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
      };

      res.status(200).json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      console.error('Get dispute dashboard error:', error);
      res.status(500).json({ 
        error: 'Failed to get dispute dashboard',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
