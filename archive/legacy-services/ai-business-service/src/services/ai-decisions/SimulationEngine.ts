import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Types for Simulation Engine
export interface SimulationRequest {
  businessAccountId: string;
  name: string;
  description?: string;
  scenarioType: 'REVENUE_CHANGE' | 'COST_STRUCTURE' | 'PRICING_ADJUSTMENT' | 'MARKET_CONDITION';
  basePeriodId: string;
  parameters: Record<string, number>; // parameter_name: value
}

export interface SimulationResult {
  scenarioId: string;
  scenarioName: string;
  scenarioType: string;
  basePeriod: string;
  results: {
    incomeStatement: any;
    balanceSheet: any;
    cashFlow: any;
    ratios: any;
  };
  comparison: {
    revenueChange: number;
    profitChange: number;
    cashFlowChange: number;
    keyMetricsDiff: Record<string, number>;
  };
  generatedAt: Date;
}

export interface ScenarioComparison {
  businessAccountId: string;
  name: string;
  scenarioIds: string[];
  comparisonMetrics: string[];
  results: {
    scenarios: any[];
    bestScenario: string;
    recommendations: string[];
  };
}

// Validation schemas
const CreateSimulationSchema = z.object({
  businessAccountId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  scenarioType: z.enum(['REVENUE_CHANGE', 'COST_STRUCTURE', 'PRICING_ADJUSTMENT', 'MARKET_CONDITION']),
  basePeriodId: z.string().uuid(),
  parameters: z.record(z.number())
});

const CompareScenariosSchema = z.object({
  businessAccountId: z.string().uuid(),
  name: z.string().min(1).max(255),
  scenarioIds: z.array(z.string().uuid()).min(2),
  comparisonMetrics: z.array(z.string()).min(1)
});

export class SimulationEngine {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new simulation scenario
   */
  async createSimulation(request: SimulationRequest, userId: string): Promise<any> {
    try {
      const validated = CreateSimulationSchema.parse(request);

      // Create scenario using database function
      const scenarioId = await this.prisma.$queryRaw`
        SELECT * FROM create_simulation_scenario(
          ${validated.businessAccountId},
          ${validated.name},
          ${validated.scenarioType},
          ${validated.basePeriodId},
          ${JSON.stringify(validated.parameters)}
        )
      ` as any[];

      // Update scenario with additional details
      await this.prisma.$queryRaw`
        UPDATE simulation_scenarios 
        SET 
          description = ${validated.description || null},
          status = 'RUNNING'
        WHERE id = ${scenarioId[0].create_simulation_scenario}
      `;

      // Run simulation
      await this.runSimulation(scenarioId[0].create_simulation_scenario);

      return {
        scenarioId: scenarioId[0].create_simulation_scenario,
        status: 'COMPLETED'
      };
    } catch (error) {
      console.error('Error creating simulation:', error);
      throw new Error('Failed to create simulation scenario');
    }
  }

  /**
   * Run simulation calculations
   */
  private async runSimulation(scenarioId: string): Promise<void> {
    try {
      // Get scenario details
      const scenario = await this.prisma.$queryRaw`
        SELECT 
          ss.*,
          fp.name as base_period_name,
          fp.start_date as base_start_date,
          fp.end_date as base_end_date
        FROM simulation_scenarios ss
        JOIN fiscal_periods fp ON ss.base_period_id = fp.id
        WHERE ss.id = ${scenarioId}
      ` as any[];

      if (scenario.length === 0) {
        throw new Error('Scenario not found');
      }

      const scenarioData = scenario[0];
      const parameters = scenarioData.simulation_parameters;

      // Get base period financial data
      const baseFinancialData = await this.getBaseFinancialData(
        scenarioData.business_account_id,
        scenarioData.base_period_id
      );

      // Calculate simulated financial statements
      const simulatedResults = await this.calculateSimulatedResults(
        baseFinancialData,
        parameters,
        scenarioData.scenario_type
      );

      // Save simulation results
      await this.saveSimulationResults(scenarioId, simulatedResults);

      // Update scenario status
      await this.prisma.$queryRaw`
        UPDATE simulation_scenarios 
        SET status = 'COMPLETED', updated_at = NOW()
        WHERE id = ${scenarioId}
      `;
    } catch (error) {
      console.error('Error running simulation:', error);
      // Update scenario status to error
      await this.prisma.$queryRaw`
        UPDATE simulation_scenarios 
        SET status = 'ERROR', updated_at = NOW()
        WHERE id = ${scenarioId}
      `;
      throw error;
    }
  }

  /**
   * Get base period financial data
   */
  private async getBaseFinancialData(businessAccountId: string, periodId: string): Promise<any> {
    try {
      const financialData = await this.prisma.$queryRaw`
        SELECT 
          fs.*,
          fp.name as period_name,
          fp.start_date,
          fp.end_date
        FROM financial_statements fs
        JOIN fiscal_periods fp ON fs.fiscal_period_id = fp.id
        WHERE fs.business_account_id = ${businessAccountId}
        AND fs.fiscal_period_id = ${periodId}
      ` as any[];

      const ratios = await this.prisma.$queryRaw`
        SELECT *
        FROM financial_ratios
        WHERE business_account_id = ${businessAccountId}
        AND fiscal_period_id = ${periodId}
      ` as any[];

      return {
        financialStatement: financialData[0] || {},
        ratios: ratios || []
      };
    } catch (error) {
      console.error('Error getting base financial data:', error);
      throw new Error('Failed to retrieve base financial data');
    }
  }

  /**
   * Calculate simulated results based on parameters
   */
  private async calculateSimulatedResults(
    baseData: any,
    parameters: Record<string, number>,
    scenarioType: string
  ): Promise<any> {
    try {
      const baseFS = baseData.financialStatement;
      const baseRatios = baseData.ratios;

      let simulatedRevenue = baseFS.revenue || 0;
      let simulatedExpenses = baseFS.expenses || 0;
      let simulatedCostOfGoods = baseFS.cost_of_goods_sold || 0;

      // Apply scenario-specific calculations
      switch (scenarioType) {
        case 'REVENUE_CHANGE':
          const revenueGrowth = parameters.revenue_growth_rate || 0;
          simulatedRevenue = simulatedRevenue * (1 + revenueGrowth / 100);
          
          // Adjust COGS proportionally
          if (simulatedCostOfGoods > 0) {
            simulatedCostOfGoods = simulatedCostOfGoods * (1 + revenueGrowth / 100);
          }
          break;

        case 'COST_STRUCTURE':
          const costReduction = parameters.cost_reduction_percentage || 0;
          simulatedExpenses = simulatedExpenses * (1 - costReduction / 100);
          
          const cogsReduction = parameters.cogs_reduction_percentage || 0;
          simulatedCostOfGoods = simulatedCostOfGoods * (1 - cogsReduction / 100);
          break;

        case 'PRICING_ADJUSTMENT':
          const priceChange = parameters.price_change_percentage || 0;
          const volumeChange = parameters.volume_change_percentage || 0;
          
          // Revenue = Price × Volume
          simulatedRevenue = simulatedRevenue * (1 + priceChange / 100) * (1 + volumeChange / 100);
          
          // COGS scales with volume
          if (simulatedCostOfGoods > 0) {
            simulatedCostOfGoods = simulatedCostOfGoods * (1 + volumeChange / 100);
          }
          break;

        case 'MARKET_CONDITION':
          const marketGrowth = parameters.market_growth_rate || 0;
          const marketShare = parameters.market_share_change || 0;
          
          simulatedRevenue = simulatedRevenue * (1 + marketGrowth / 100 + marketShare / 100);
          
          // Adjust expenses for market conditions
          const marketingIncrease = parameters.marketing_spend_increase || 0;
          simulatedExpenses = simulatedExpenses * (1 + marketingIncrease / 100);
          break;
      }

      // Calculate derived values
      const grossProfit = simulatedRevenue - simulatedCostOfGoods;
      const operatingExpenses = simulatedExpenses - simulatedCostOfGoods;
      const operatingIncome = grossProfit - operatingExpenses;
      
      // Assume same tax rate as base period
      const taxRate = baseFS.tax_rate || 0.2;
      const taxExpense = operatingIncome * taxRate;
      const netIncome = operatingIncome - taxExpense;

      // Calculate simulated ratios
      const simulatedRatios = this.calculateSimulatedRatios(
        {
          revenue: simulatedRevenue,
          costOfGoodsSold: simulatedCostOfGoods,
          expenses: simulatedExpenses,
          grossProfit,
          operatingIncome,
          netIncome
        },
        baseFS
      );

      return {
        incomeStatement: {
          revenue: simulatedRevenue,
          costOfGoodsSold: simulatedCostOfGoods,
          grossProfit,
          operatingExpenses,
          operatingIncome,
          taxExpense,
          netIncome
        },
        ratios: simulatedRatios,
        assumptions: parameters
      };
    } catch (error) {
      console.error('Error calculating simulated results:', error);
      throw new Error('Failed to calculate simulation results');
    }
  }

  /**
   * Calculate simulated financial ratios
   */
  private calculateSimulatedRatios(simulatedData: any, baseData: any): any[] {
    const ratios = [];

    // Profitability Ratios
    if (simulatedData.revenue > 0) {
      ratios.push({
        ratioName: 'gross_profit_margin',
        ratioValue: (simulatedData.grossProfit / simulatedData.revenue) * 100,
        ratioType: 'PROFITABILITY'
      });

      ratios.push({
        ratioName: 'net_profit_margin',
        ratioValue: (simulatedData.netIncome / simulatedData.revenue) * 100,
        ratioType: 'PROFITABILITY'
      });
    }

    // Growth Ratios (compared to base)
    if (baseData.revenue > 0) {
      ratios.push({
        ratioName: 'revenue_growth',
        ratioValue: ((simulatedData.revenue - baseData.revenue) / baseData.revenue) * 100,
        ratioType: 'GROWTH'
      });
    }

    if (baseData.netIncome > 0) {
      ratios.push({
        ratioName: 'profit_growth',
        ratioValue: ((simulatedData.netIncome - baseData.netIncome) / Math.abs(baseData.netIncome)) * 100,
        ratioType: 'GROWTH'
      });
    }

    return ratios;
  }

  /**
   * Save simulation results to database
   */
  private async saveSimulationResults(scenarioId: string, results: any): Promise<void> {
    try {
      // Save income statement results
      await this.prisma.$queryRaw`
        INSERT INTO simulation_results (
          scenario_id, result_type, financial_data, key_metrics, created_at
        ) VALUES (
          ${scenarioId},
          'INCOME_STATEMENT',
          ${JSON.stringify(results.incomeStatement)},
          ${JSON.stringify({
            revenue: results.incomeStatement.revenue,
            netIncome: results.incomeStatement.netIncome,
            grossProfit: results.incomeStatement.grossProfit
          })},
          NOW()
        )
      `;

      // Save ratios
      await this.prisma.$queryRaw`
        INSERT INTO simulation_results (
          scenario_id, result_type, financial_data, key_metrics, created_at
        ) VALUES (
          ${scenarioId},
          'RATIOS',
          ${JSON.stringify(results.ratios)},
          ${JSON.stringify({
            totalRatios: results.ratios.length,
            profitabilityRatios: results.ratios.filter((r: any) => r.ratioType === 'PROFITABILITY').length,
            growthRatios: results.ratios.filter((r: any) => r.ratioType === 'GROWTH').length
          })},
          NOW()
        )
      `;
    } catch (error) {
      console.error('Error saving simulation results:', error);
      throw new Error('Failed to save simulation results');
    }
  }

  /**
   * Get simulation results
   */
  async getSimulationResults(scenarioId: string): Promise<SimulationResult> {
    try {
      // Get scenario details
      const scenario = await this.prisma.$queryRaw`
        SELECT 
          ss.*,
          fp.name as base_period_name
        FROM simulation_scenarios ss
        JOIN fiscal_periods fp ON ss.base_period_id = fp.id
        WHERE ss.id = ${scenarioId}
      ` as any[];

      if (scenario.length === 0) {
        throw new Error('Scenario not found');
      }

      // Get simulation results
      const results = await this.prisma.$queryRaw`
        SELECT result_type, financial_data, key_metrics
        FROM simulation_results
        WHERE scenario_id = ${scenarioId}
        ORDER BY created_at ASC
      ` as any[];

      // Parse results
      let incomeStatement = {};
      let ratios = [];
      let comparison = {};

      for (const result of results) {
        const financialData = typeof result.financial_data === 'string' 
          ? JSON.parse(result.financial_data) 
          : result.financial_data;

        if (result.result_type === 'INCOME_STATEMENT') {
          incomeStatement = financialData;
        } else if (result.result_type === 'RATIOS') {
          ratios = financialData;
        }
      }

      // Calculate comparison with baseline
      const baseData = await this.getBaseFinancialData(
        scenario[0].business_account_id,
        scenario[0].base_period_id
      );

      comparison = this.calculateComparison(baseData.financialStatement, incomeStatement);

      return {
        scenarioId,
        scenarioName: scenario[0].name,
        scenarioType: scenario[0].scenario_type,
        basePeriod: scenario[0].base_period_name,
        results: {
          incomeStatement,
          balanceSheet: {}, // Would need to implement balance sheet calculations
          cashFlow: {}, // Would need to implement cash flow calculations
          ratios
        },
        comparison,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting simulation results:', error);
      throw new Error('Failed to retrieve simulation results');
    }
  }

  /**
   * Calculate comparison between baseline and simulation
   */
  private calculateComparison(baseData: any, simulatedData: any): any {
    const baseRevenue = baseData.revenue || 0;
    const baseProfit = baseData.net_income || 0;
    const baseCashFlow = baseData.cash_flow || 0;

    const simRevenue = simulatedData.revenue || 0;
    const simProfit = simulatedData.netIncome || 0;
    const simCashFlow = simulatedData.cashFlow || 0;

    return {
      revenueChange: baseRevenue > 0 ? ((simRevenue - baseRevenue) / baseRevenue) * 100 : 0,
      profitChange: baseProfit > 0 ? ((simProfit - baseProfit) / Math.abs(baseProfit)) * 100 : 0,
      cashFlowChange: baseCashFlow > 0 ? ((simCashFlow - baseCashFlow) / baseCashFlow) * 100 : 0,
      keyMetricsDiff: {
        revenue: simRevenue - baseRevenue,
        profit: simProfit - baseProfit,
        cashFlow: simCashFlow - baseCashFlow
      }
    };
  }

  /**
   * Get all scenarios for a business account
   */
  async getScenarios(businessAccountId: string, filters: {
    scenarioType?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    try {
      let query = `
        SELECT 
          ss.*,
          fp.name as base_period_name,
          COUNT(sr.id) as result_count
        FROM simulation_scenarios ss
        JOIN fiscal_periods fp ON ss.base_period_id = fp.id
        LEFT JOIN simulation_results sr ON ss.id = sr.scenario_id
        WHERE ss.business_account_id = $1
      `;

      const params: any[] = [businessAccountId];
      let paramIndex = 2;

      if (filters.scenarioType) {
        query += ` AND ss.scenario_type = $${paramIndex++}`;
        params.push(filters.scenarioType);
      }

      if (filters.status) {
        query += ` AND ss.status = $${paramIndex++}`;
        params.push(filters.status);
      }

      query += ` GROUP BY ss.id, fp.name ORDER BY ss.created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      const scenarios = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      // Parse JSON fields
      return scenarios.map(scenario => ({
        ...scenario,
        simulationParameters: typeof scenario.simulation_parameters === 'string' 
          ? JSON.parse(scenario.simulation_parameters) 
          : scenario.simulation_parameters,
        metadata: typeof scenario.metadata === 'string' 
          ? JSON.parse(scenario.metadata) 
          : scenario.metadata
      }));
    } catch (error) {
      console.error('Error getting scenarios:', error);
      throw new Error('Failed to retrieve scenarios');
    }
  }

  /**
   * Compare multiple scenarios
   */
  async compareScenarios(request: ScenarioComparison, userId: string): Promise<any> {
    try {
      const validated = CompareScenariosSchema.parse(request);

      // Get all scenarios
      const scenarios = await this.prisma.$queryRaw`
        SELECT ss.*, fp.name as base_period_name
        FROM simulation_scenarios ss
        JOIN fiscal_periods fp ON ss.base_period_id = fp.id
        WHERE ss.id = ANY(${validated.scenarioIds})
        AND ss.business_account_id = ${validated.businessAccountId}
        AND ss.status = 'COMPLETED'
      ` as any[];

      if (scenarios.length < 2) {
        throw new Error('At least 2 completed scenarios are required for comparison');
      }

      // Get results for all scenarios
      const scenarioResults = [];
      for (const scenario of scenarios) {
        const results = await this.getSimulationResults(scenario.id);
        scenarioResults.push({
          scenario,
          results
        });
      }

      // Perform comparison analysis
      const comparisonResults = this.performScenarioComparison(scenarioResults, validated.comparisonMetrics);

      // Save comparison
      const comparisonId = await this.prisma.$queryRaw`
        INSERT INTO scenario_comparisons (
          business_account_id, name, scenario_ids, comparison_metrics,
          comparison_results, created_by, created_at
        ) VALUES (
          ${validated.businessAccountId},
          ${validated.name},
          ${validated.scenarioIds},
          ${JSON.stringify(validated.comparisonMetrics)},
          ${JSON.stringify(comparisonResults)},
          ${userId},
          NOW()
        )
        RETURNING id
      ` as any[];

      return {
        comparisonId: comparisonId[0].id,
        ...comparisonResults
      };
    } catch (error) {
      console.error('Error comparing scenarios:', error);
      throw new Error('Failed to compare scenarios');
    }
  }

  /**
   * Perform scenario comparison analysis
   */
  private performScenarioComparison(scenarioResults: any[], metrics: string[]): any {
    const comparison = {
      scenarios: scenarioResults.map(sr => ({
        scenarioId: sr.scenario.id,
        scenarioName: sr.scenario.name,
        scenarioType: sr.scenario.scenario_type,
        keyMetrics: {
          revenue: sr.results.results.incomeStatement.revenue || 0,
          netIncome: sr.results.results.incomeStatement.netIncome || 0,
          grossProfit: sr.results.results.incomeStatement.grossProfit || 0
        },
        comparison: sr.results.comparison
      })),
      bestScenario: '',
      recommendations: [] as string[]
    };

    // Find best scenario based on metrics
    let bestScore = -Infinity;
    for (const scenario of comparison.scenarios) {
      let score = 0;
      
      if (metrics.includes('revenue')) {
        score += scenario.keyMetrics.revenue;
      }
      if (metrics.includes('profit')) {
        score += scenario.keyMetrics.netIncome;
      }
      if (metrics.includes('growth')) {
        score += scenario.comparison.revenueChange;
      }

      if (score > bestScore) {
        bestScore = score;
        comparison.bestScenario = scenario.scenarioName;
      }
    }

    // Generate recommendations
    const bestScenarioData = comparison.scenarios.find(s => s.scenarioName === comparison.bestScenario);
    if (bestScenarioData) {
      comparison.recommendations.push(
        `Implement ${bestScenarioData.scenarioName} scenario for optimal results`
      );
      
      if (bestScenarioData.comparison.revenueChange > 10) {
        comparison.recommendations.push(
          'Focus on revenue growth strategies from the best performing scenario'
        );
      }
      
      if (bestScenarioData.comparison.profitChange > 15) {
        comparison.recommendations.push(
          'Cost optimization strategies in this scenario show strong potential'
        );
      }
    }

    return comparison;
  }

  /**
   * Delete a scenario
   */
  async deleteScenario(scenarioId: string, businessAccountId: string): Promise<void> {
    try {
      // Verify ownership
      const scenario = await this.prisma.$queryRaw`
        SELECT id FROM simulation_scenarios 
        WHERE id = ${scenarioId} AND business_account_id = ${businessAccountId}
      ` as any[];

      if (scenario.length === 0) {
        throw new Error('Scenario not found or access denied');
      }

      // Delete scenario and related data (cascade should handle this)
      await this.prisma.$queryRaw`
        DELETE FROM simulation_scenarios 
        WHERE id = ${scenarioId}
      `;
    } catch (error) {
      console.error('Error deleting scenario:', error);
      throw new Error('Failed to delete scenario');
    }
  }
}
