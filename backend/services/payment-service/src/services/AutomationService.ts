import { Pool } from 'pg';
import { EventEmitter } from 'events';

export interface PayoutRule {
  id?: string;
  sellerId: string;
  ruleName: string;
  ruleType: 'threshold' | 'schedule' | 'instant' | 'conditional';
  triggerConditions: any;
  payoutSettings: any;
  isActive: boolean;
  autoApprove: boolean;
  riskThreshold: number;
}

export interface EscrowReleaseRule {
  id?: string;
  ruleName: string;
  ruleType: 'delivery_confirmation' | 'time_based' | 'quality_check' | 'hybrid';
  triggerConditions: any;
  releaseConditions: any;
  verificationMethods: any;
  isActive: boolean;
  autoRelease: boolean;
  cooldownPeriodHours: number;
}

export interface PSPConfiguration {
  id?: string;
  pspName: string;
  pspType: 'stripe' | 'paypal' | 'adyen' | 'square' | 'razorpay' | 'paystack' | 'flutterwave';
  region: string;
  apiCredentials: any;
  webhookEndpoints: any;
  supportedCurrencies: string[];
  supportedMethods: string[];
  feeStructure: any;
  isActive: boolean;
  priority: number;
}

export class AutomationService extends EventEmitter {
  private pool: Pool;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private automationInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  /**
   * Initialize automation service
   */
  async initialize(): Promise<void> {
    console.log('🤖 Initializing Automation Service...');
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    // Start automation processing
    this.startAutomationProcessing();
    
    console.log('✅ Automation Service initialized successfully');
  }

  /**
   * Create automated payout rule
   */
  async createPayoutRule(ruleData: PayoutRule): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO automated_payout_rules (
          seller_id, rule_name, rule_type, trigger_conditions, 
          payout_settings, is_active, auto_approve, risk_threshold
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const values = [
        ruleData.sellerId,
        ruleData.ruleName,
        ruleData.ruleType,
        JSON.stringify(ruleData.triggerConditions),
        JSON.stringify(ruleData.payoutSettings),
        ruleData.isActive,
        ruleData.autoApprove,
        ruleData.riskThreshold
      ];
      
      const result = await client.query(query, values);
      const rule = result.rows[0];
      
      // Log creation
      await this.logAutomationEvent('payout', rule.id, 'rule_created', null, null, null);
      
      this.emit('payoutRuleCreated', rule);
      return rule;
      
    } finally {
      client.release();
    }
  }

  /**
   * Process automated payouts
   */
  async processAutomatedPayouts(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Get active payout rules
      const rulesResult = await client.query(`
        SELECT * FROM automated_payout_rules 
        WHERE is_active = true 
        ORDER BY priority DESC
      `);
      
      for (const rule of rulesResult.rows) {
        await this.processPayoutRule(rule, client);
      }
      
    } catch (error) {
      console.error('Error processing automated payouts:', error);
      this.emit('error', { type: 'payout_processing', error });
    } finally {
      client.release();
    }
  }

  /**
   * Process individual payout rule
   */
  private async processPayoutRule(rule: any, client: any): Promise<void> {
    try {
      const triggerConditions = rule.trigger_conditions;
      
      // Check different trigger types
      switch (rule.rule_type) {
        case 'threshold':
          await this.processThresholdPayout(rule, triggerConditions, client);
          break;
        case 'schedule':
          await this.processScheduledPayout(rule, triggerConditions, client);
          break;
        case 'instant':
          await this.processInstantPayout(rule, triggerConditions, client);
          break;
        case 'conditional':
          await this.processConditionalPayout(rule, triggerConditions, client);
          break;
      }
      
    } catch (error) {
      console.error(`Error processing payout rule ${rule.id}:`, error);
      await this.logAutomationEvent('payout', rule.id, 'rule_error', null, null, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Process threshold-based payout
   */
  private async processThresholdPayout(rule: any, conditions: any, client: any): Promise<void> {
    const { minAmount, maxAmount } = conditions;
    
    // Get seller's available balance
    const balanceResult = await client.query(
      'SELECT get_seller_payout_summary($1) as summary',
      [rule.seller_id]
    );
    
    const summary = balanceResult.rows[0]?.summary;
    const availableBalance = summary?.available_balance || 0;
    
    if (availableBalance >= minAmount && availableBalance <= (maxAmount || Infinity)) {
      // Check eligibility
      const eligible = await client.query(
        'SELECT check_automated_payout_eligibility($1, $2) as eligible',
        [rule.seller_id, availableBalance]
      );
      
      if (eligible.rows[0].eligible) {
        await this.executeAutomatedPayout(rule, availableBalance, client);
      }
    }
  }

  /**
   * Execute automated payout
   */
  private async executeAutomatedPayout(rule: any, amount: number, client: any): Promise<void> {
    try {
      // Calculate fees
      const feeResult = await client.query('SELECT calculate_payout_fee($1) as fee', [amount]);
      const feeAmount = feeResult.rows[0].fee;
      const netAmount = amount - feeAmount;
      
      // Create execution record
      const executionResult = await client.query(`
        INSERT INTO automated_payout_executions (
          rule_id, seller_id, amount, fee_amount, net_amount, 
          execution_status, trigger_reason, execution_details
        ) VALUES ($1, $2, $3, $4, $5, 'pending', 'threshold_met', $6)
        RETURNING *
      `, [
        rule.id,
        rule.seller_id,
        amount,
        feeAmount,
        netAmount,
        JSON.stringify({ rule_type: rule.rule_type, threshold: amount })
      ]);
      
      const execution = executionResult.rows[0];
      
      // Get seller's bank account
      const bankResult = await client.query(`
        SELECT * FROM seller_bank_accounts 
        WHERE seller_id = $1 AND is_primary = true
      `, [rule.seller_id]);
      
      if (bankResult.rows.length === 0) {
        throw new Error('No primary bank account found');
      }
      
      const bankAccount = bankResult.rows[0];
      
      // Create payout request
      const payoutResult = await client.query(`
        INSERT INTO payout_requests (
          seller_id, user_id, amount, currency, fee_amount, net_amount,
          payout_method, bank_account_name, bank_account_number, bank_name,
          bank_routing_number, bank_swift_code, status, is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        rule.seller_id,
        rule.seller_id, // Assuming same user for now
        amount,
        'USD',
        feeAmount,
        netAmount,
        'bank_transfer',
        bankAccount.account_holder_name,
        bankAccount.account_number,
        bankAccount.bank_name,
        bankAccount.routing_number,
        bankAccount.swift_code,
        rule.auto_approve ? 'approved' : 'requested',
        true
      ]);
      
      // Update execution status
      await client.query(`
        UPDATE automated_payout_executions 
        SET execution_status = 'completed', completed_at = NOW()
        WHERE id = $1
      `, [execution.id]);
      
      // Log success
      await this.logAutomationEvent('payout', execution.id, 'execution_completed', 'pending', 'completed', null);
      
      this.emit('automatedPayoutExecuted', { execution, payout: payoutResult.rows[0] });
      
    } catch (error) {
      // Update execution with error
      await client.query(`
        UPDATE automated_payout_executions 
        SET execution_status = 'failed', error_message = $1
        WHERE rule_id = $2 AND execution_status = 'pending'
      `, [error instanceof Error ? error.message : String(error), rule.id]);
      
      throw error;
    }
  }

  /**
   * Process smart escrow releases
   */
  async processEscrowReleases(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Get funded escrow transactions
      const transactionsResult = await client.query(`
        SELECT * FROM escrow_kenya_transactions 
        WHERE status = 'funded' 
        AND id NOT IN (
          SELECT escrow_transaction_id FROM escrow_release_executions 
          WHERE release_status IN ('released', 'processing')
        )
      `);
      
      for (const transaction of transactionsResult.rows) {
        await this.processEscrowTransaction(transaction, client);
      }
      
    } catch (error) {
      console.error('Error processing escrow releases:', error);
      this.emit('error', { type: 'escrow_processing', error });
    } finally {
      client.release();
    }
  }

  /**
   * Process individual escrow transaction
   */
  private async processEscrowTransaction(transaction: any, client: any): Promise<void> {
    try {
      // Check release conditions
      const shouldRelease = await client.query(
        'SELECT check_escrow_release_conditions($1) as should_release',
        [transaction.id]
      );
      
      if (!shouldRelease.rows[0].should_release) {
        return;
      }
      
      // Get active release rules
      const rulesResult = await client.query(`
        SELECT * FROM escrow_release_rules 
        WHERE is_active = true 
        ORDER BY priority DESC
      `);
      
      for (const rule of rulesResult.rows) {
        if (await this.evaluateEscrowRule(rule, transaction, client)) {
          await this.executeEscrowRelease(rule, transaction, client);
          break; // Stop after first successful rule
        }
      }
      
    } catch (error) {
      console.error(`Error processing escrow transaction ${transaction.id}:`, error);
      await this.logAutomationEvent('escrow_release', transaction.id, 'processing_error', null, null, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Evaluate escrow release rule
   */
  private async evaluateEscrowRule(rule: any, transaction: any, client: any): Promise<boolean> {
    const triggerConditions = rule.trigger_conditions;
    
    switch (rule.rule_type) {
      case 'delivery_confirmation':
        return await this.checkDeliveryConfirmation(transaction, triggerConditions, client);
      case 'time_based':
        return await this.checkTimeBasedRelease(transaction, triggerConditions, client);
      case 'quality_check':
        return await this.checkQualityCheck(transaction, triggerConditions, client);
      case 'hybrid':
        return await this.checkHybridConditions(rule, transaction, client);
      default:
        return false;
    }
  }

  /**
   * Execute escrow release
   */
  private async executeEscrowRelease(rule: any, transaction: any, client: any): Promise<void> {
    try {
      // Create release execution record
      const executionResult = await client.query(`
        INSERT INTO escrow_release_executions (
          escrow_transaction_id, rule_id, release_status, trigger_reason,
          verification_data, release_details, requires_manual_review
        ) VALUES ($1, $2, 'triggered', $3, $4, $5, $6)
        RETURNING *
      `, [
        transaction.id,
        rule.id,
        `rule_${rule.rule_type}_triggered`,
        JSON.stringify({ rule_type: rule.rule_type }),
        JSON.stringify({ auto_release: rule.auto_release }),
        !rule.auto_release
      ]);
      
      const execution = executionResult.rows[0];
      
      if (rule.auto_release) {
        // Perform actual release via Escrow Kenya API
        const releaseResult = await this.performEscrowRelease(transaction, client);
        
        // Update execution
        await client.query(`
          UPDATE escrow_release_executions 
          SET release_status = 'released', released_at = NOW(), release_details = $1
          WHERE id = $2
        `, [JSON.stringify(releaseResult), execution.id]);
        
        // Update transaction status
        await client.query(`
          UPDATE escrow_kenya_transactions 
          SET status = 'released', released_at = NOW()
          WHERE id = $1
        `, [transaction.id]);
        
        this.emit('escrowReleased', { transaction, execution, releaseResult });
        
      } else {
        // Mark for manual review
        await client.query(`
          UPDATE escrow_release_executions 
          SET release_status = 'verifying'
          WHERE id = $1
        `, [execution.id]);
        
        this.emit('escrowReleasePendingReview', { transaction, execution });
      }
      
      // Log success
      await this.logAutomationEvent('escrow_release', execution.id, 'release_executed', 'triggered', 'released', null);
      
    } catch (error) {
      // Update execution with error
      await client.query(`
        UPDATE escrow_release_executions 
        SET release_status = 'failed', error_message = $1
        WHERE escrow_transaction_id = $2 AND release_status = 'triggered'
      `, [error instanceof Error ? error.message : String(error), transaction.id]);
      
      throw error;
    }
  }

  /**
   * Perform actual escrow release via API
   */
  private async performEscrowRelease(transaction: any, client: any): Promise<any> {
    // This would integrate with Escrow Kenya API
    // For now, return mock response
    return {
      success: true,
      release_id: `release_${Date.now()}`,
      amount: transaction.amount,
      released_at: new Date().toISOString()
    };
  }

  /**
   * Route transaction to best PSP
   */
  async routeToBestPSP(transactionData: any): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      // Select best PSP based on criteria
      const pspResult = await client.query(
        'SELECT select_best_psp($1, $2, $3, $4) as psp_id',
        [transactionData.region, transactionData.amount, transactionData.currency, transactionData.method]
      );
      
      const bestPspId = pspResult.rows[0]?.psp_id;
      
      if (!bestPspId) {
        throw new Error('No suitable PSP found for transaction');
      }
      
      // Get PSP configuration
      const pspConfigResult = await client.query(
        'SELECT * FROM psp_configurations WHERE id = $1',
        [bestPspId]
      );
      
      const pspConfig = pspConfigResult.rows[0];
      
      // Create mapping record
      const mappingResult = await client.query(`
        INSERT INTO psp_transaction_mappings (
          internal_transaction_id, psp_id, psp_transaction_id, 
          psp_status, routing_reason
        ) VALUES ($1, $2, $3, 'initiated', $4)
        RETURNING *
      `, [
        transactionData.transactionId,
        bestPspId,
        `psp_${Date.now()}`,
        `Best match for ${transactionData.region} - ${transactionData.currency}`
      ]);
      
      this.emit('transactionRouted', { transaction: transactionData, psp: pspConfig, mapping: mappingResult.rows[0] });
      
      return {
        psp: pspConfig,
        mapping: mappingResult.rows[0]
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * Monitor PSP health
   */
  async monitorPSPHealth(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      const pspsResult = await client.query(
        'SELECT * FROM psp_configurations WHERE is_active = true'
      );
      
      for (const psp of pspsResult.rows) {
        await this.checkPSPHealth(psp, client);
      }
      
    } catch (error) {
      console.error('Error monitoring PSP health:', error);
    } finally {
      client.release();
    }
  }

  /**
   * Check individual PSP health
   */
  private async checkPSPHealth(psp: any, client: any): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Perform health check (this would be actual API call)
      const isHealthy = await this.performPSPHealthCheck(psp);
      
      const responseTime = Date.now() - startTime;
      
      // Get current health status
      const currentHealthResult = await client.query(
        'SELECT * FROM psp_health_status WHERE psp_id = $1 ORDER BY last_check DESC LIMIT 1',
        [psp.id]
      );
      
      const currentHealth = currentHealthResult.rows[0];
      const consecutiveFailures = currentHealth?.consecutive_failures || 0;
      
      // Determine new status
      let newStatus = 'healthy';
      let newConsecutiveFailures = 0;
      
      if (!isHealthy) {
        newStatus = 'down';
        newConsecutiveFailures = consecutiveFailures + 1;
      } else if (responseTime > 2000) {
        newStatus = 'degraded';
        newConsecutiveFailures = 0;
      }
      
      // Update health status
      await client.query(`
        INSERT INTO psp_health_status (
          psp_id, status, response_time_ms, consecutive_failures, last_check
        ) VALUES ($1, $2, $3, $4, NOW())
      `, [psp.id, newStatus, responseTime, newConsecutiveFailures]);
      
      // Deactivate PSP if too many failures
      const failureThreshold = await this.getAutomationSetting('psp_failure_threshold', '3');
      if (newConsecutiveFailures >= parseInt(failureThreshold)) {
        await client.query(
          'UPDATE psp_configurations SET is_active = false WHERE id = $1',
          [psp.id]
        );
        
        this.emit('pspDeactivated', { psp, reason: 'Too many consecutive failures' });
      }
      
    } catch (error) {
      console.error(`Error checking health for PSP ${psp.id}:`, error);
    }
  }

  /**
   * Perform actual PSP health check
   */
  private async performPSPHealthCheck(psp: any): Promise<boolean> {
    // This would perform actual health check against PSP API
    // For now, return mock response
    return Math.random() > 0.1; // 90% success rate
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    const interval = parseInt(this.getAutomationSettingSync('psp_health_check_interval', '300')) * 1000;
    
    this.healthCheckInterval = setInterval(() => {
      this.monitorPSPHealth();
    }, interval);
    
    console.log(`🏥 PSP Health monitoring started (interval: ${interval}ms)`);
  }

  /**
   * Start automation processing
   */
  private startAutomationProcessing(): void {
    this.automationInterval = setInterval(() => {
      this.processAutomatedPayouts();
      this.processEscrowReleases();
    }, 60000); // Run every minute
    
    console.log('🤖 Automation processing started (interval: 1 minute)');
  }

  /**
   * Get automation setting
   */
  async getAutomationSetting(key: string, defaultValue: string = ''): Promise<string> {
    const result = await this.pool.query(
      'SELECT setting_value FROM automation_settings WHERE setting_key = $1',
      [key]
    );
    
    return result.rows[0]?.setting_value || defaultValue;
  }

  /**
   * Get automation setting (synchronous)
   */
  private getAutomationSettingSync(key: string, defaultValue: string = ''): string {
    // For synchronous calls, return default value
    // In production, this should be cached
    return defaultValue;
  }

  /**
   * Get all automation settings
   */
  async getAutomationSettings(): Promise<any> {
    const result = await this.pool.query(
      'SELECT setting_key, setting_value, setting_type, description FROM automation_settings ORDER BY setting_key'
    );
    
    const settings: any = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = {
        value: row.setting_value,
        type: row.setting_type,
        description: row.description,
      };
    });
    
    return settings;
  }

  /**
   * Update automation setting
   */
  async updateAutomationSetting(key: string, value: string): Promise<void> {
    await this.pool.query(
      'UPDATE automation_settings SET setting_value = $1, updated_at = NOW() WHERE setting_key = $2',
      [value, key]
    );
  }

  /**
   * Log automation event
   */
  private async logAutomationEvent(
    type: string,
    entityId: string,
    action: string,
    oldStatus: string | null,
    newStatus: string | null,
    errorMessage: string | null
  ): Promise<void> {
    await this.pool.query(`
      INSERT INTO automation_audit_log (
        automation_type, entity_id, action, old_status, new_status, error_message, performed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [type, entityId, action, oldStatus, newStatus, errorMessage]);
  }

  /**
   * Stop automation service
   */
  async stop(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.automationInterval) {
      clearInterval(this.automationInterval);
    }
    
    console.log('🛑 Automation Service stopped');
  }

  // Helper methods for rule evaluation
  private async checkDeliveryConfirmation(transaction: any, conditions: any, client: any): Promise<boolean> {
    // Mock implementation - would check actual delivery confirmation
    return Math.random() > 0.3;
  }

  private async checkTimeBasedRelease(transaction: any, conditions: any, client: any): Promise<boolean> {
    const daysSinceFunding = Math.floor(
      (Date.now() - new Date(transaction.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceFunding >= (conditions.days_since_funding || 14);
  }

  private async checkQualityCheck(transaction: any, conditions: any, client: any): Promise<boolean> {
    // Mock implementation - would check quality metrics
    return Math.random() > 0.2;
  }

  private async checkHybridConditions(rule: any, transaction: any, client: any): Promise<boolean> {
    // Combine multiple conditions
    const timeOk = await this.checkTimeBasedRelease(transaction, { days_since_funding: 7 }, client);
    const deliveryOk = await this.checkDeliveryConfirmation(transaction, {}, client);
    return timeOk && deliveryOk;
  }

  private async processScheduledPayout(rule: any, conditions: any, client: any): Promise<void> {
    // Implementation for scheduled payouts
    console.log(`Processing scheduled payout for rule ${rule.id}`);
  }

  private async processInstantPayout(rule: any, conditions: any, client: any): Promise<void> {
    // Implementation for instant payouts
    console.log(`Processing instant payout for rule ${rule.id}`);
  }

  private async processConditionalPayout(rule: any, conditions: any, client: any): Promise<void> {
    // Implementation for conditional payouts
    console.log(`Processing conditional payout for rule ${rule.id}`);
  }
}
