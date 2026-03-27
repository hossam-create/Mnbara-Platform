import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AIRecommendationEngine } from './AIRecommendationEngine';
import { SimulationEngine } from './SimulationEngine';
import { AlertsEngine } from './AlertsEngine';

// Types for Decision Integration Layer
export interface DecisionWorkflow {
  id: string;
  businessAccountId: string;
  workflowName: string;
  workflowType: 'RECOMMENDATION_IMPLEMENTATION' | 'SIMULATION_ANALYSIS' | 'ALERT_RESPONSE';
  triggerEvent: any;
  workflowSteps: any[];
  currentStep: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ERROR';
  initiatedBy: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkflowRequest {
  businessAccountId: string;
  workflowName: string;
  workflowType: 'RECOMMENDATION_IMPLEMENTATION' | 'SIMULATION_ANALYSIS' | 'ALERT_RESPONSE';
  triggerEvent: any;
  initiatedBy: string;
}

export interface DecisionOutcome {
  id: string;
  workflowId: string;
  decisionType: string;
  decisionData: any;
  expectedOutcome?: any;
  actualOutcome?: any;
  outcomeDate?: Date;
  successRating?: number; // 1-5
  lessonsLearned?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardData {
  recommendations: {
    total: number;
    immediate: number;
    shortTerm: number;
    strategic: number;
    pending: number;
    accepted: number;
    implemented: number;
    avgConfidence: number;
    totalImpactValue: number;
  };
  simulations: {
    total: number;
    running: number;
    completed: number;
    byType: Record<string, number>;
  };
  alerts: {
    critical: number;
    warning: number;
    info: number;
    totalActive: number;
    unacknowledged: number;
    thisWeek: number;
    resolvedThisWeek: number;
  };
  decisions: {
    totalDecisions: number;
    avgSuccessRating: number;
    successfulDecisions: number;
    unsuccessfulDecisions: number;
    avgRoi: number;
  };
}

// Validation schemas
const CreateWorkflowSchema = z.object({
  businessAccountId: z.string().uuid(),
  workflowName: z.string().min(1).max(255),
  workflowType: z.enum(['RECOMMENDATION_IMPLEMENTATION', 'SIMULATION_ANALYSIS', 'ALERT_RESPONSE']),
  triggerEvent: z.any(),
  initiatedBy: z.string().uuid()
});

const ExecuteWorkflowSchema = z.object({
  workflowId: z.string().uuid(),
  action: z.string(),
  parameters: z.any().optional()
});

const RecordOutcomeSchema = z.object({
  workflowId: z.string().uuid(),
  decisionType: z.string(),
  decisionData: z.any(),
  expectedOutcome: z.any().optional(),
  actualOutcome: z.any().optional(),
  outcomeDate: z.date().optional(),
  successRating: z.number().min(1).max(5).optional(),
  lessonsLearned: z.string().optional()
});

export class DecisionIntegrationLayer {
  constructor(
    private prisma: PrismaClient,
    private recommendationEngine: AIRecommendationEngine,
    private simulationEngine: SimulationEngine,
    private alertsEngine: AlertsEngine
  ) {}

  /**
   * Create a new decision workflow
   */
  async createWorkflow(request: CreateWorkflowRequest): Promise<DecisionWorkflow> {
    try {
      const validated = CreateWorkflowSchema.parse(request);

      // Generate workflow steps based on type
      const workflowSteps = this.generateWorkflowSteps(
        validated.workflowType,
        validated.triggerEvent
      );

      const result = await this.prisma.$queryRaw`
        INSERT INTO decision_workflows (
          business_account_id, workflow_name, workflow_type, trigger_event,
          workflow_steps, current_step, status, initiated_by, created_at, updated_at
        ) VALUES (
          ${validated.businessAccountId},
          ${validated.workflowName},
          ${validated.workflowType},
          ${JSON.stringify(validated.triggerEvent)},
          ${JSON.stringify(workflowSteps)},
          0,
          'ACTIVE',
          ${validated.initiatedBy},
          NOW(),
          NOW()
        )
        RETURNING id, workflow_name, workflow_type, status, created_at
      ` as any[];

      const workflow = await this.getWorkflowById(result[0].id);
      return workflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw new Error('Failed to create decision workflow');
    }
  }

  /**
   * Generate workflow steps based on workflow type
   */
  private generateWorkflowSteps(workflowType: string, triggerEvent: any): any[] {
    const baseSteps = [
      { step: 1, name: 'Initialize', status: 'PENDING', description: 'Initialize workflow' }
    ];

    switch (workflowType) {
      case 'RECOMMENDATION_IMPLEMENTATION':
        return [
          ...baseSteps,
          { step: 2, name: 'Analyze Recommendation', status: 'PENDING', description: 'Analyze the recommendation details' },
          { step: 3, name: 'Generate Action Plan', status: 'PENDING', description: 'Create implementation action plan' },
          { step: 4, name: 'Execute Actions', status: 'PENDING', description: 'Execute the recommended actions' },
          { step: 5, name: 'Monitor Results', status: 'PENDING', description: 'Monitor implementation results' },
          { step: 6, name: 'Complete', status: 'PENDING', description: 'Complete workflow' }
        ];

      case 'SIMULATION_ANALYSIS':
        return [
          ...baseSteps,
          { step: 2, name: 'Run Simulation', status: 'PENDING', description: 'Execute simulation scenarios' },
          { step: 3, name: 'Compare Results', status: 'PENDING', description: 'Compare simulation results' },
          { step: 4, name: 'Generate Insights', status: 'PENDING', description: 'Generate actionable insights' },
          { step: 5, name: 'Recommend Decision', status: 'PENDING', description: 'Provide decision recommendation' },
          { step: 6, name: 'Complete', status: 'PENDING', description: 'Complete workflow' }
        ];

      case 'ALERT_RESPONSE':
        return [
          ...baseSteps,
          { step: 2, name: 'Assess Alert', status: 'PENDING', description: 'Assess alert severity and impact' },
          { step: 3, name: 'Investigate Cause', status: 'PENDING', description: 'Investigate root cause' },
          { step: 4, name: 'Implement Solution', status: 'PENDING', description: 'Implement corrective actions' },
          { step: 5, name: 'Verify Resolution', status: 'PENDING', description: 'Verify issue resolution' },
          { step: 6, name: 'Complete', status: 'PENDING', description: 'Complete workflow' }
        ];

      default:
        return baseSteps;
    }
  }

  /**
   * Get workflow by ID
   */
  private async getWorkflowById(workflowId: string): Promise<DecisionWorkflow> {
    try {
      const workflows = await this.prisma.$queryRaw`
        SELECT 
          id, business_account_id, workflow_name, workflow_type, trigger_event,
          workflow_steps, current_step, status, initiated_by, completed_at,
          created_at, updated_at
        FROM decision_workflows 
        WHERE id = ${workflowId}
      ` as any[];

      if (workflows.length === 0) {
        throw new Error('Workflow not found');
      }

      const workflow = workflows[0];
      return {
        ...workflow,
        triggerEvent: typeof workflow.trigger_event === 'string' 
          ? JSON.parse(workflow.trigger_event) 
          : workflow.trigger_event,
        workflowSteps: typeof workflow.workflow_steps === 'string' 
          ? JSON.parse(workflow.workflow_steps) 
          : workflow.workflow_steps
      };
    } catch (error) {
      console.error('Error getting workflow:', error);
      throw new Error('Failed to retrieve workflow');
    }
  }

  /**
   * Execute workflow step
   */
  async executeWorkflowStep(workflowId: string, action: string, parameters?: any): Promise<any> {
    try {
      const validated = ExecuteWorkflowSchema.parse({ workflowId, action, parameters });

      const workflow = await this.getWorkflowById(validated.workflowId);
      
      if (workflow.status !== 'ACTIVE') {
        throw new Error('Workflow is not active');
      }

      // Execute action based on workflow type and current step
      const result = await this.executeWorkflowAction(workflow, action, parameters);

      // Update workflow progress
      await this.updateWorkflowProgress(validated.workflowId, action, result);

      return result;
    } catch (error) {
      console.error('Error executing workflow step:', error);
      throw new Error('Failed to execute workflow step');
    }
  }

  /**
   * Execute specific workflow action
   */
  private async executeWorkflowAction(workflow: DecisionWorkflow, action: string, parameters?: any): Promise<any> {
    try {
      switch (workflow.workflowType) {
        case 'RECOMMENDATION_IMPLEMENTATION':
          return await this.executeRecommendationWorkflow(workflow, action, parameters);

        case 'SIMULATION_ANALYSIS':
          return await this.executeSimulationWorkflow(workflow, action, parameters);

        case 'ALERT_RESPONSE':
          return await this.executeAlertWorkflow(workflow, action, parameters);

        default:
          throw new Error(`Unknown workflow type: ${workflow.workflowType}`);
      }
    } catch (error) {
      console.error('Error executing workflow action:', error);
      throw error;
    }
  }

  /**
   * Execute recommendation implementation workflow
   */
  private async executeRecommendationWorkflow(workflow: DecisionWorkflow, action: string, parameters?: any): Promise<any> {
    switch (action) {
      case 'analyze_recommendation':
        const recommendationId = parameters?.recommendationId;
        if (!recommendationId) {
          throw new Error('Recommendation ID is required');
        }
        
        const recommendations = await this.recommendationEngine.getRecommendations(
          workflow.businessAccountId,
          { type: null, status: 'PENDING', limit: 1 }
        );
        
        return {
          action: 'analyze_recommendation',
          result: recommendations[0] || null,
          nextStep: 'generate_action_plan'
        };

      case 'generate_action_plan':
        return {
          action: 'generate_action_plan',
          result: {
            actionPlan: [
              'Review recommendation details',
              'Assign responsibility',
              'Set timeline',
              'Define success metrics',
              'Allocate resources'
            ]
          },
          nextStep: 'execute_actions'
        };

      case 'execute_actions':
        // Simulate action execution
        return {
          action: 'execute_actions',
          result: {
            executedActions: ['Action 1 completed', 'Action 2 in progress'],
            progress: 60
          },
          nextStep: 'monitor_results'
        };

      case 'monitor_results':
        return {
          action: 'monitor_results',
          result: {
            metrics: {
              completion: 85,
              impact: 'Positive',
              issues: []
            }
          },
          nextStep: 'complete'
        };

      case 'complete':
        return {
          action: 'complete',
          result: {
            status: 'COMPLETED',
            summary: 'Recommendation implemented successfully'
          },
          nextStep: null
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Execute simulation analysis workflow
   */
  private async executeSimulationWorkflow(workflow: DecisionWorkflow, action: string, parameters?: any): Promise<any> {
    switch (action) {
      case 'run_simulation':
        const scenarioId = parameters?.scenarioId;
        if (!scenarioId) {
          throw new Error('Scenario ID is required');
        }
        
        const results = await this.simulationEngine.getSimulationResults(scenarioId);
        return {
          action: 'run_simulation',
          result: results,
          nextStep: 'compare_results'
        };

      case 'compare_results':
        return {
          action: 'compare_results',
          result: {
            comparison: {
              scenarios: ['Scenario A', 'Scenario B'],
              bestScenario: 'Scenario A',
              keyDifferences: ['Revenue +15%', 'Costs -5%']
            }
          },
          nextStep: 'generate_insights'
        };

      case 'generate_insights':
        return {
          action: 'generate_insights',
          result: {
            insights: [
              'Revenue growth scenario shows highest ROI',
              'Cost reduction provides stable returns',
              'Combined approach recommended'
            ]
          },
          nextStep: 'recommend_decision'
        };

      case 'recommend_decision':
        return {
          action: 'recommend_decision',
          result: {
            recommendation: 'Implement revenue growth strategy',
            confidence: 85,
            expectedOutcome: '20% revenue increase in 6 months'
          },
          nextStep: 'complete'
        };

      case 'complete':
        return {
          action: 'complete',
          result: {
            status: 'COMPLETED',
            summary: 'Simulation analysis completed'
          },
          nextStep: null
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Execute alert response workflow
   */
  private async executeAlertWorkflow(workflow: DecisionWorkflow, action: string, parameters?: any): Promise<any> {
    switch (action) {
      case 'assess_alert':
        const alertId = parameters?.alertId;
        if (!alertId) {
          throw new Error('Alert ID is required');
        }
        
        const alerts = await this.alertsEngine.getActiveAlerts(workflow.businessAccountId, { limit: 1 });
        return {
          action: 'assess_alert',
          result: alerts[0] || null,
          nextStep: 'investigate_cause'
        };

      case 'investigate_cause':
        return {
          action: 'investigate_cause',
          result: {
            rootCause: 'Cash flow issue due to delayed payments',
            contributingFactors: ['Seasonal slowdown', 'Increased expenses'],
            urgency: 'HIGH'
          },
          nextStep: 'implement_solution'
        };

      case 'implement_solution':
        return {
          action: 'implement_solution',
          result: {
            solution: 'Accelerate receivables collection',
            actions: ['Send reminders', 'Offer early payment discounts'],
            timeline: '2 weeks'
          },
          nextStep: 'verify_resolution'
        };

      case 'verify_resolution':
        return {
          action: 'verify_resolution',
          result: {
            verification: {
              issueResolved: true,
              metricsImproved: true,
              monitoringRequired: true
            }
          },
          nextStep: 'complete'
        };

      case 'complete':
        return {
          action: 'complete',
          result: {
            status: 'COMPLETED',
            summary: 'Alert resolved successfully'
          },
          nextStep: null
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Update workflow progress
   */
  private async updateWorkflowProgress(workflowId: string, action: string, result: any): Promise<void> {
    try {
      // Get current workflow
      const workflow = await this.getWorkflowById(workflowId);
      
      // Update current step
      const newStep = workflow.currentStep + 1;
      const workflowSteps = [...workflow.workflowSteps];
      
      // Mark current step as completed
      if (workflowSteps[workflow.currentStep]) {
        workflowSteps[workflow.currentStep].status = 'COMPLETED';
      }
      
      // Mark next step as in progress
      if (workflowSteps[newStep]) {
        workflowSteps[newStep].status = 'IN_PROGRESS';
      }

      // Check if workflow is complete
      const isComplete = result.nextStep === null || newStep >= workflowSteps.length;
      
      await this.prisma.$queryRaw`
        UPDATE decision_workflows 
        SET 
          current_step = ${newStep},
          workflow_steps = ${JSON.stringify(workflowSteps)},
          status = ${isComplete ? 'COMPLETED' : 'ACTIVE'},
          completed_at = ${isComplete ? 'NOW()' : 'NULL'},
          updated_at = NOW()
        WHERE id = ${workflowId}
      `;

      // Record outcome if workflow is complete
      if (isComplete) {
        await this.recordDecisionOutcome({
          workflowId,
          decisionType: workflow.workflowType,
          decisionData: result,
          expectedOutcome: result.expectedOutcome,
          actualOutcome: result.result,
          outcomeDate: new Date(),
          successRating: result.successRating || 4
        });
      }
    } catch (error) {
      console.error('Error updating workflow progress:', error);
      throw new Error('Failed to update workflow progress');
    }
  }

  /**
   * Record decision outcome
   */
  async recordDecisionOutcome(request: RecordOutcomeSchema): Promise<DecisionOutcome> {
    try {
      const validated = RecordOutcomeSchema.parse(request);

      const result = await this.prisma.$queryRaw`
        INSERT INTO decision_outcomes (
          workflow_id, decision_type, decision_data, expected_outcome,
          actual_outcome, outcome_date, success_rating, lessons_learned,
          created_at, updated_at
        ) VALUES (
          ${validated.workflowId},
          ${validated.decisionType},
          ${JSON.stringify(validated.decisionData)},
          ${JSON.stringify(validated.expectedOutcome) || null},
          ${JSON.stringify(validated.actualOutcome) || null},
          ${validated.outcomeDate || null},
          ${validated.successRating || null},
          ${validated.lessonsLearned || null},
          NOW(),
          NOW()
        )
        RETURNING id, decision_type, success_rating, created_at
      ` as any[];

      const outcome = await this.getDecisionOutcomeById(result[0].id);
      return outcome;
    } catch (error) {
      console.error('Error recording decision outcome:', error);
      throw new Error('Failed to record decision outcome');
    }
  }

  /**
   * Get decision outcome by ID
   */
  private async getDecisionOutcomeById(outcomeId: string): Promise<DecisionOutcome> {
    try {
      const outcomes = await this.prisma.$queryRaw`
        SELECT 
          id, workflow_id, decision_type, decision_data, expected_outcome,
          actual_outcome, outcome_date, success_rating, lessons_learned,
          created_at, updated_at
        FROM decision_outcomes 
        WHERE id = ${outcomeId}
      ` as any[];

      if (outcomes.length === 0) {
        throw new Error('Decision outcome not found');
      }

      const outcome = outcomes[0];
      return {
        ...outcome,
        decisionData: typeof outcome.decision_data === 'string' 
          ? JSON.parse(outcome.decision_data) 
          : outcome.decision_data,
        expectedOutcome: typeof outcome.expected_outcome === 'string' 
          ? JSON.parse(outcome.expected_outcome) 
          : outcome.expected_outcome,
        actualOutcome: typeof outcome.actual_outcome === 'string' 
          ? JSON.parse(outcome.actual_outcome) 
          : outcome.actual_outcome
      };
    } catch (error) {
      console.error('Error getting decision outcome:', error);
      throw new Error('Failed to retrieve decision outcome');
    }
  }

  /**
   * Get workflows for a business account
   */
  async getWorkflows(businessAccountId: string, filters: {
    workflowType?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<DecisionWorkflow[]> {
    try {
      let query = `
        SELECT 
          id, business_account_id, workflow_name, workflow_type, trigger_event,
          workflow_steps, current_step, status, initiated_by, completed_at,
          created_at, updated_at
        FROM decision_workflows 
        WHERE business_account_id = $1
      `;

      const params: any[] = [businessAccountId];
      let paramIndex = 2;

      if (filters.workflowType) {
        query += ` AND workflow_type = $${paramIndex++}`;
        params.push(filters.workflowType);
      }

      if (filters.status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(filters.status);
      }

      query += ` ORDER BY created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      const workflows = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      // Parse JSON fields
      return workflows.map(workflow => ({
        ...workflow,
        triggerEvent: typeof workflow.trigger_event === 'string' 
          ? JSON.parse(workflow.trigger_event) 
          : workflow.trigger_event,
        workflowSteps: typeof workflow.workflow_steps === 'string' 
          ? JSON.parse(workflow.workflow_steps) 
          : workflow.workflow_steps
      }));
    } catch (error) {
      console.error('Error getting workflows:', error);
      throw new Error('Failed to retrieve workflows');
    }
  }

  /**
   * Get dashboard data for decision layer
   */
  async getDashboardData(businessAccountId: string): Promise<DashboardData> {
    try {
      // Get recommendation summary
      const recommendations = await this.recommendationEngine.getRecommendationSummary(businessAccountId);

      // Get simulation summary
      const simulations = await this.getSimulationSummary(businessAccountId);

      // Get alert summary
      const alerts = await this.alertsEngine.getAlertSummary(businessAccountId);

      // Get decision success metrics
      const decisions = await this.getDecisionSuccessMetrics(businessAccountId);

      return {
        recommendations,
        simulations,
        alerts,
        decisions
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw new Error('Failed to retrieve dashboard data');
    }
  }

  /**
   * Get simulation summary
   */
  private async getSimulationSummary(businessAccountId: string): Promise<any> {
    try {
      const summary = await this.prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_scenarios,
          COUNT(*) FILTER (WHERE status = 'RUNNING') as running_scenarios,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_scenarios,
          scenario_type,
          COUNT(*) as count
        FROM simulation_scenarios 
        WHERE business_account_id = ${businessAccountId}
        GROUP BY scenario_type
      ` as any[];

      const result = {
        total: 0,
        running: 0,
        completed: 0,
        byType: {} as Record<string, number>
      };

      summary.forEach((row: any) => {
        result.total += row.count || 0;
        result.running += row.running_scenarios || 0;
        result.completed += row.completed_scenarios || 0;
        result.byType[row.scenario_type] = row.count || 0;
      });

      return result;
    } catch (error) {
      console.error('Error getting simulation summary:', error);
      return { total: 0, running: 0, completed: 0, byType: {} };
    }
  }

  /**
   * Get decision success metrics
   */
  private async getDecisionSuccessMetrics(businessAccountId: string): Promise<any> {
    try {
      const metrics = await this.prisma.$queryRaw`
        SELECT 
          COUNT(do.id) as total_decisions,
          AVG(do.success_rating) as avg_success_rating,
          COUNT(*) FILTER (WHERE do.success_rating >= 4) as successful_decisions,
          COUNT(*) FILTER (WHERE do.success_rating <= 2) as unsuccessful_decisions,
          AVG(CASE WHEN do.actual_outcome IS NOT NULL THEN 
            (do.actual_outcome->>'roi')::DECIMAL(10,2) 
          END) as avg_roi
        FROM decision_workflows dw
        JOIN decision_outcomes do ON dw.id = do.workflow_id
        WHERE dw.business_account_id = ${businessAccountId}
        AND do.success_rating IS NOT NULL
      ` as any[];

      return metrics[0] || {
        totalDecisions: 0,
        avgSuccessRating: 0,
        successfulDecisions: 0,
        unsuccessfulDecisions: 0,
        avgRoi: 0
      };
    } catch (error) {
      console.error('Error getting decision success metrics:', error);
      return {
        totalDecisions: 0,
        avgSuccessRating: 0,
        successfulDecisions: 0,
        unsuccessfulDecisions: 0,
        avgRoi: 0
      };
    }
  }

  /**
   * Execute WhatsApp command for decision layer
   */
  async executeWhatsAppCommand(
    businessAccountId: string,
    command: string,
    parameters: any,
    userId: string
  ): Promise<any> {
    try {
      switch (command) {
        case 'recommendations':
          return await this.recommendationEngine.getRecommendations(businessAccountId, {
            limit: parameters.limit || 5
          });

        case 'simulate':
          if (!parameters.scenarioType || !parameters.basePeriodId) {
            throw new Error('Scenario type and base period are required for simulation');
          }
          return await this.simulationEngine.createSimulation({
            businessAccountId,
            name: parameters.name || 'WhatsApp Simulation',
            scenarioType: parameters.scenarioType,
            basePeriodId: parameters.basePeriodId,
            parameters: parameters.parameters || {}
          }, userId);

        case 'alerts':
          return await this.alertsEngine.getActiveAlerts(businessAccountId, {
            limit: parameters.limit || 10
          });

        case 'optimize_costs':
          return await this.createWorkflow({
            businessAccountId,
            workflowName: 'Cost Optimization Workflow',
            workflowType: 'RECOMMENDATION_IMPLEMENTATION',
            triggerEvent: { command: 'optimize_costs', parameters },
            initiatedBy: userId
          });

        case 'dashboard':
          return await this.getDashboardData(businessAccountId);

        default:
          throw new Error(`Unknown command: ${command}`);
      }
    } catch (error) {
      console.error('Error executing WhatsApp command:', error);
      throw new Error(`Failed to execute command: ${command}`);
    }
  }
}
