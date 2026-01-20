import { Pool } from 'pg';
import { EventEmitter } from 'events';

export interface DisputeTicket {
  id?: string;
  ticketNumber?: string;
  disputeId?: string;
  categoryId: string;
  complainantId: string;
  respondentId: string;
  title: string;
  description: string;
  disputeType: 'payment' | 'delivery' | 'quality' | 'fraud' | 'service' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
  severityScore: number;
  disputedAmount?: number;
  currency?: string;
  compensationRequested?: number;
  status?: 'open' | 'investigating' | 'mediating' | 'escalated' | 'resolved' | 'closed' | 'cancelled';
  assignedAgentId?: string;
  escalationLevel?: number;
}

export interface DisputeMessage {
  id?: string;
  ticketId: string;
  senderId: string;
  senderType: 'complainant' | 'respondent' | 'agent' | 'system' | 'mediator';
  messageType: 'message' | 'evidence' | 'note' | 'system_update' | 'escalation';
  content: string;
  isInternal?: boolean;
  isVisibleToCustomer?: boolean;
  attachments?: any;
}

export interface SLARule {
  id?: string;
  name: string;
  ruleType: 'first_response' | 'resolution' | 'escalation' | 'follow_up';
  disputeCategoryId?: string;
  priorityLevel?: string;
  amountThreshold?: number;
  targetHours: number;
  warningThresholdHours?: number;
  breachThresholdHours?: number;
  actionOnBreach?: any;
  escalationOnBreach?: boolean;
  autoEscalationLevel?: number;
  businessHoursOnly?: boolean;
  businessHours?: any;
  holidays?: any;
  isActive?: boolean;
}

export class DisputeSystemService extends EventEmitter {
  private pool: Pool;
  private slaCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  /**
   * Initialize dispute service
   */
  async initialize(): Promise<void> {
    console.log('🏛️ Initializing Dispute Service...');
    
    // Start SLA monitoring
    this.startSLAMonitoring();
    
    console.log('✅ Dispute Service initialized successfully');
  }

  /**
   * Create new dispute ticket
   */
  async createDisputeTicket(ticketData: DisputeTicket): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Generate ticket number
      const ticketNumberResult = await client.query('SELECT generate_ticket_number() as ticket_number');
      const ticketNumber = ticketNumberResult.rows[0].ticket_number;

      // Calculate SLA deadline
      const slaDeadline = await this.calculateSLADeadline(
        ticketData.categoryId,
        ticketData.priority,
        ticketData.disputedAmount || 0,
        'first_response'
      );

      // Insert dispute ticket
      const insertQuery = `
        INSERT INTO dispute_tickets (
          ticket_number, dispute_id, category_id, complainant_id, respondent_id,
          title, description, dispute_type, priority, severity_score,
          disputed_amount, currency, compensation_requested,
          status, sla_deadline, first_response_due, escalation_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 1)
        RETURNING *
      `;

      const values = [
        ticketNumber,
        ticketData.disputeId,
        ticketData.categoryId,
        ticketData.complainantId,
        ticketData.respondentId,
        ticketData.title,
        ticketData.description,
        ticketData.disputeType,
        ticketData.priority,
        ticketData.severityScore,
        ticketData.disputedAmount,
        ticketData.currency || 'USD',
        ticketData.compensationRequested,
        'open',
        slaDeadline,
        slaDeadline, // First response due same as SLA deadline initially
      ];

      const result = await client.query(insertQuery, values);
      const ticket = result.rows[0];

      // Create initial system message
      await this.addDisputeMessage(ticket.id, 'system', 'system', 'system_update', 
        `Dispute ticket ${ticketNumber} created successfully.`, true, true, client);

      // Auto-assign agent if available
      await this.autoAssignAgent(ticket.id, client);

      await client.query('COMMIT');

      this.emit('disputeCreated', ticket);
      return ticket;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Add message to dispute ticket
   */
  async addDisputeMessage(
    ticketId: string,
    senderId: string,
    senderType: string,
    messageType: string,
    content: string,
    isInternal: boolean = false,
    isVisibleToCustomer: boolean = true,
    client?: any
  ): Promise<any> {
    const useClient = client || this.pool;
    
    const query = `
      INSERT INTO dispute_messages (
        ticket_id, sender_id, sender_type, message_type, content,
        is_internal, is_visible_to_customer
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [ticketId, senderId, senderType, messageType, content, isInternal, isVisibleToCustomer];
    const result = await useClient.query(query, values);
    const message = result.rows[0];

    // Update first response time if this is agent's first response
    if (senderType === 'agent' && isVisibleToCustomer) {
      await this.updateFirstResponseTime(ticketId, useClient);
    }

    this.emit('messageAdded', { ticketId, message });
    return message;
  }

  /**
   * Update dispute ticket status
   */
  async updateTicketStatus(
    ticketId: string,
    newStatus: string,
    subStatus?: string,
    assignedAgentId?: string,
    escalationLevel?: number
  ): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      const updateFields = ['status = $2', 'updated_at = NOW()'];
      const values = [ticketId, newStatus];
      let paramCount = 2;

      if (subStatus) {
        paramCount++;
        updateFields.push(`sub_status = $${paramCount}`);
        values.push(subStatus);
      }

      if (assignedAgentId) {
        paramCount++;
        updateFields.push(`assigned_agent_id = $${paramCount}`);
        values.push(assignedAgentId);
      }

      if (escalationLevel) {
        paramCount++;
        updateFields.push(`escalation_level = $${paramCount}`);
        values.push(String(escalationLevel));
      }

      // Set timestamps based on status
      if (newStatus === 'resolved') {
        updateFields.push('resolved_at = NOW()');
      } else if (newStatus === 'closed') {
        updateFields.push('closed_at = NOW()');
      }

      const query = `
        UPDATE dispute_tickets 
        SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING *
      `;

      const result = await client.query(query, values);
      const updatedTicket = result.rows[0];

      this.emit('ticketStatusUpdated', { ticketId, oldStatus: null, newStatus, ticket: updatedTicket });
      return updatedTicket;

    } finally {
      client.release();
    }
  }

  /**
   * Add evidence to dispute
   */
  async addEvidence(
    ticketId: string,
    submittedById: string,
    evidenceType: string,
    fileName: string,
    filePath: string,
    fileSize: number,
    fileType: string,
    description?: string
  ): Promise<any> {
    const query = `
      INSERT INTO dispute_evidence (
        ticket_id, submitted_by_id, evidence_type, file_name,
        file_path, file_size, file_type, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      ticketId, submittedById, evidenceType, fileName,
      filePath, fileSize, fileType, description
    ];

    const result = await this.pool.query(query, values);
    const evidence = result.rows[0];

    this.emit('evidenceAdded', { ticketId, evidence });
    return evidence;
  }

  /**
   * Process SLA rules and check compliance
   */
  async processSLACompliance(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Get all active tickets with pending SLA checks
      const ticketsResult = await client.query(`
        SELECT * FROM dispute_tickets 
        WHERE status IN ('open', 'investigating', 'mediating')
        AND (sla_deadline IS NULL OR sla_deadline <= NOW() + INTERVAL '24 hours')
      `);

      for (const ticket of ticketsResult.rows) {
        await this.checkAndUpdateSLA(ticket, client);
      }

    } catch (error) {
      console.error('Error processing SLA compliance:', error);
    } finally {
      client.release();
    }
  }

  /**
   * Check and update SLA for individual ticket
   */
  private async checkAndUpdateSLA(ticket: any, client: any): Promise<void> {
    try {
      // Check if SLA is breached
      const isBreached = ticket.sla_deadline && new Date() > new Date(ticket.sla_deadline);
      
      if (isBreached && !ticket.sla_breached) {
        // Mark SLA as breached
        await client.query(
          'UPDATE dispute_tickets SET sla_breached = true WHERE id = $1',
          [ticket.id]
        );

        // Escalate if configured
        await this.handleSLABreach(ticket, client);

        this.emit('slaBreached', { ticket });
      }

      // Check for warning threshold
      const warningThreshold = new Date(ticket.sla_deadline);
      warningThreshold.setHours(warningThreshold.getHours() - 4); // 4 hours before deadline

      if (new Date() >= warningThreshold && !ticket.sla_breached) {
        this.emit('slaWarning', { ticket });
      }

    } catch (error) {
      console.error(`Error checking SLA for ticket ${ticket.id}:`, error);
    }
  }

  /**
   * Handle SLA breach
   */
  private async handleSLABreach(ticket: any, client: any): Promise<void> {
    try {
      // Get SLA rule for breach action
      const slaRuleResult = await client.query(`
        SELECT * FROM sla_rules 
        WHERE is_active = true 
        AND rule_type = 'resolution'
        AND (dispute_category_id IS NULL OR dispute_category_id = $1)
        AND (priority_level IS NULL OR priority_level = $2)
        ORDER BY 
          CASE WHEN dispute_category_id IS NOT NULL THEN 1 ELSE 2 END,
          CASE WHEN priority_level IS NOT NULL THEN 1 ELSE 2 END
        LIMIT 1
      `, [ticket.category_id, ticket.priority]);

      const slaRule = slaRuleResult.rows[0];

      if (slaRule && slaRule.escalation_on_breach) {
        // Escalate ticket
        const newEscalationLevel = (ticket.escalation_level || 1) + 1;
        
        await this.updateTicketStatus(
          ticket.id,
          'escalated',
          'sla_breach',
          undefined,
          newEscalationLevel
        );

        // Add system message
        await this.addDisputeMessage(
          ticket.id,
          'system',
          'system',
          'escalation',
          `Ticket escalated due to SLA breach. Escalation level: ${newEscalationLevel}`,
          true,
          true,
          client
        );

        this.emit('ticketEscalated', { ticket, escalationLevel: newEscalationLevel, reason: 'sla_breach' });
      }

    } catch (error) {
      console.error(`Error handling SLA breach for ticket ${ticket.id}:`, error);
    }
  }

  /**
   * Auto-assign agent to ticket
   */
  private async autoAssignAgent(ticketId: string, client: any): Promise<void> {
    try {
      // Find available agent with least workload
      const agentResult = await client.query(`
        SELECT u.id, COUNT(dt.id) as current_workload
        FROM users u
        LEFT JOIN dispute_tickets dt ON u.id = dt.assigned_agent_id 
          AND dt.status IN ('open', 'investigating', 'mediating')
        WHERE u.role IN ('agent', 'manager')
        AND u.is_active = true
        GROUP BY u.id
        ORDER BY current_workload ASC, u.created_at ASC
        LIMIT 1
      `);

      const agent = agentResult.rows[0];

      if (agent) {
        await client.query(
          'UPDATE dispute_tickets SET assigned_agent_id = $1 WHERE id = $2',
          [agent.id, ticketId]
        );

        this.emit('agentAssigned', { ticketId, agentId: agent.id });
      }

    } catch (error) {
      console.error(`Error auto-assigning agent for ticket ${ticketId}:`, error);
    }
  }

  /**
   * Calculate SLA deadline
   */
  private async calculateSLADeadline(
    categoryId: string,
    priority: string,
    amount: number,
    slaType: string
  ): Promise<Date> {
    const result = await this.pool.query(
      'SELECT calculate_sla_deadline($1, $2, $3, $4) as deadline',
      [categoryId, priority, amount, slaType]
    );

    return result.rows[0].deadline;
  }

  /**
   * Update first response time
   */
  private async updateFirstResponseTime(ticketId: string, client: any): Promise<void> {
    await client.query(
      'UPDATE dispute_tickets SET first_response_at = NOW() WHERE id = $1 AND first_response_at IS NULL',
      [ticketId]
    );
  }

  /**
   * Get dispute tickets with filters
   */
  async getDisputeTickets(filters: any = {}): Promise<any[]> {
    const {
      status,
      priority,
      assignedAgentId,
      complainantId,
      categoryId,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = filters;

    let query = `
      SELECT dt.*, dc.name as category_name, 
             u1.name as complainant_name, u2.name as respondent_name,
             ua.name as agent_name
      FROM dispute_tickets dt
      LEFT JOIN dispute_categories dc ON dt.category_id = dc.id
      LEFT JOIN users u1 ON dt.complainant_id = u1.id
      LEFT JOIN users u2 ON dt.respondent_id = u2.id
      LEFT JOIN users ua ON dt.assigned_agent_id = ua.id
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND dt.status = $${paramCount}`;
      values.push(status);
    }

    if (priority) {
      paramCount++;
      query += ` AND dt.priority = $${paramCount}`;
      values.push(priority);
    }

    if (assignedAgentId) {
      paramCount++;
      query += ` AND dt.assigned_agent_id = $${paramCount}`;
      values.push(assignedAgentId);
    }

    if (complainantId) {
      paramCount++;
      query += ` AND dt.complainant_id = $${paramCount}`;
      values.push(complainantId);
    }

    if (categoryId) {
      paramCount++;
      query += ` AND dt.category_id = $${paramCount}`;
      values.push(categoryId);
    }

    if (startDate) {
      paramCount++;
      query += ` AND dt.created_at >= $${paramCount}`;
      values.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND dt.created_at <= $${paramCount}`;
      values.push(endDate);
    }

    query += ` ORDER BY dt.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    values.push(limit, offset);

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  /**
   * Get dispute messages for ticket
   */
  async getDisputeMessages(ticketId: string, includeInternal: boolean = false): Promise<any[]> {
    const query = includeInternal
      ? 'SELECT * FROM dispute_messages WHERE ticket_id = $1 ORDER BY created_at ASC'
      : 'SELECT * FROM dispute_messages WHERE ticket_id = $1 AND is_visible_to_customer = true ORDER BY created_at ASC';

    const result = await this.pool.query(query, [ticketId]);
    return result.rows;
  }

  /**
   * Get dispute evidence
   */
  async getDisputeEvidence(ticketId: string): Promise<any[]> {
    const result = await this.pool.query(
      'SELECT * FROM dispute_evidence WHERE ticket_id = $1 ORDER BY created_at ASC',
      [ticketId]
    );
    return result.rows;
  }

  /**
   * Get dispute categories
   */
  async getDisputeCategories(): Promise<any[]> {
    const result = await this.pool.query(
      'SELECT * FROM dispute_categories WHERE is_active = true ORDER BY severity_level DESC'
    );
    return result.rows;
  }

  /**
   * Get SLA rules
   */
  async getSLARules(): Promise<any[]> {
    const result = await this.pool.query(
      'SELECT * FROM sla_rules WHERE is_active = true ORDER BY rule_type, priority_level'
    );
    return result.rows;
  }

  /**
   * Get dispute analytics
   */
  async getDisputeAnalytics(startDate?: Date, endDate?: Date): Promise<any> {
    const query = `
      SELECT * FROM dispute_analytics 
      WHERE date_bucket >= COALESCE($1, CURRENT_DATE - INTERVAL '30 days')
        AND date_bucket <= COALESCE($2, CURRENT_DATE)
      ORDER BY date_bucket DESC
    `;

    const result = await this.pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  /**
   * Get agent performance
   */
  async getAgentPerformance(agentId?: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    let query = `
      SELECT * FROM agent_performance 
      WHERE date_bucket >= COALESCE($1, CURRENT_DATE - INTERVAL '30 days')
        AND date_bucket <= COALESCE($2, CURRENT_DATE)
    `;

    const values: any[] = [startDate, endDate];
    let paramCount = 2;

    if (agentId) {
      paramCount++;
      query += ` AND agent_id = $${paramCount}`;
      values.push(agentId);
    }

    query += ' ORDER BY date_bucket DESC';

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  /**
   * Start SLA monitoring
   */
  private startSLAMonitoring(): void {
    // Check SLA compliance every 5 minutes
    this.slaCheckInterval = setInterval(() => {
      this.processSLACompliance();
    }, 5 * 60 * 1000);

    console.log('⏰ SLA monitoring started (interval: 5 minutes)');
  }

  /**
   * Stop dispute service
   */
  async stop(): Promise<void> {
    if (this.slaCheckInterval) {
      clearInterval(this.slaCheckInterval);
    }

    console.log('🛑 Dispute Service stopped');
  }
}
