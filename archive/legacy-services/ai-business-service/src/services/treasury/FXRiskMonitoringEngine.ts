import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const FXRiskExposureSchema = z.object({
  businessAccountId: z.string().uuid(),
  entityId: z.string().uuid().optional(),
  currency: z.string().length(3),
  baseCurrency: z.string().length(3).default('USD'),
  exposureType: z.enum(['transactional', 'translation', 'economic']),
  exposureAmount: z.number(),
  currentRate: z.number(),
  averageRate: z.number().optional(),
  hedgePercentage: z.number().default(0),
  hedgeInstrument: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  volatility30d: z.number().default(0),
  volatility90d: z.number().default(0),
  var95_1d: z.number().default(0),
  exposureDate: z.string().date(),
  createdBy: z.string().uuid()
});

const FXHedgeSchema = z.object({
  businessAccountId: z.string().uuid(),
  entityId: z.string().uuid().optional(),
  hedgeType: z.enum(['forward', 'option', 'swap', 'futures', 'other']),
  currency: z.string().length(3),
  baseCurrency: z.string().length(3).default('USD'),
  hedgeAmount: z.number(),
  hedgeRate: z.number(),
  maturityDate: z.string().date(),
  counterparty: z.string().max(200),
  hedgeInstrument: z.string().max(100),
  status: z.enum(['active', 'matured', 'cancelled', 'partial']),
  cost: z.number().default(0),
  effectiveness: z.number().min(0).max(100).default(0),
  createdBy: z.string().uuid()
});

const FXAlertSchema = z.object({
  businessAccountId: z.string().uuid(),
  entityId: z.string().uuid().optional(),
  alertType: z.enum(['volatility_spike', 'rate_threshold', 'var_breach', 'hedge_expiry', 'concentration_risk', 'correlation_breakdown']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  currency: z.string().length(3),
  title: z.string().min(1).max(200),
  description: z.string(),
  thresholdValue: z.number(),
  currentValue: z.number(),
  variancePercentage: z.number(),
  alertData: z.record(z.any()).default({}),
  createdBy: z.string().uuid()
});

export interface FXRiskExposure {
  id: string;
  businessAccountId: string;
  entityId?: string;
  currency: string;
  baseCurrency: string;
  exposureType: string;
  exposureAmount: number;
  currentRate: number;
  averageRate?: number;
  unrealizedGainLoss: number;
  hedgePercentage: number;
  hedgeInstrument?: string;
  riskLevel: string;
  volatility30d: number;
  volatility90d: number;
  var95_1d: number;
  exposureDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FXHedge {
  id: string;
  businessAccountId: string;
  entityId?: string;
  hedgeType: string;
  currency: string;
  baseCurrency: string;
  hedgeAmount: number;
  hedgeRate: number;
  maturityDate: Date;
  counterparty?: string;
  hedgeInstrument?: string;
  status: string;
  cost: number;
  effectiveness: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FXAlert {
  id: string;
  businessAccountId: string;
  entityId?: string;
  alertType: string;
  severity: string;
  currency: string;
  title: string;
  description: string;
  thresholdValue: number;
  currentValue: number;
  variancePercentage: number;
  alertData: any;
  status: string;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdBy: string;
  createdAt: Date;
}

export interface FXPosition {
  currency: string;
  exposureAmount: number;
  currentRate: number;
  unrealizedGainLoss: number;
  hedgeAmount: number;
  netExposure: number;
  riskLevel: string;
  volatility: number;
  var95_1d: number;
}

export interface FXRiskMetrics {
  totalExposure: number;
  totalUnrealizedGL: number;
  hedgeCoverage: number;
  weightedVolatility: number;
  totalVar95_1d: number;
  highRiskCount: number;
  criticalRiskCount: number;
  concentrationRisk: number;
  correlationRisk: number;
}

export interface FXScenarioAnalysis {
  scenarioName: string;
  description: string;
  parameters: any;
  results: {
    totalExposure: number;
    unrealizedGL: number;
    hedgeEffectiveness: number;
    riskMetrics: FXRiskMetrics;
  };
  recommendations: string[];
}

export class FXRiskMonitoringEngine {
  // FX Risk Exposure Management
  async createFXRiskExposure(data: z.infer<typeof FXRiskExposureSchema>): Promise<FXRiskExposure> {
    const validated = FXRiskExposureSchema.parse(data);
    
    const unrealizedGainLoss = this.calculateUnrealizedGainLoss(
      validated.exposureAmount,
      validated.currentRate,
      validated.averageRate
    );
    
    const result = await prisma.$queryRaw`
      INSERT INTO fx_risk_exposure (
        id,
        business_account_id,
        entity_id,
        currency,
        base_currency,
        exposure_type,
        exposure_amount,
        current_rate,
        average_rate,
        unrealized_gain_loss,
        hedge_percentage,
        hedge_instrument,
        risk_level,
        volatility_30d,
        volatility_90d,
        var_95_1d,
        exposure_date,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.entityId || null}::uuid,
        ${validated.currency}::varchar,
        ${validated.baseCurrency}::varchar,
        ${validated.exposureType}::varchar,
        ${validated.exposureAmount}::decimal,
        ${validated.currentRate}::decimal,
        ${validated.averageRate || null}::decimal,
        ${unrealizedGainLoss}::decimal,
        ${validated.hedgePercentage}::decimal,
        ${validated.hedgeInstrument || null}::varchar,
        ${validated.riskLevel}::varchar,
        ${validated.volatility30d}::decimal,
        ${validated.volatility90d}::decimal,
        ${validated.var95_1d}::decimal,
        ${validated.exposureDate}::date,
        ${validated.createdBy}::uuid
      ) RETURNING id
    `;
    
    const exposureId = (result as any)[0]?.id;
    return this.getFXRiskExposure(exposureId);
  }

  async getFXRiskExposure(exposureId: string): Promise<FXRiskExposure> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        entity_id as "entityId",
        currency,
        base_currency as "baseCurrency",
        exposure_type as "exposureType",
        exposure_amount as "exposureAmount",
        current_rate as "currentRate",
        average_rate as "averageRate",
        unrealized_gain_loss as "unrealizedGainLoss",
        hedge_percentage as "hedgePercentage",
        hedge_instrument as "hedgeInstrument",
        risk_level as "riskLevel",
        volatility_30d as "volatility30d",
        volatility_90d as "volatility90d",
        var_95_1d as "var95_1d",
        exposure_date as "exposureDate",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM fx_risk_exposure
      WHERE id = ${exposureId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getFXRiskExposures(businessAccountId: string, filters: {
    entityId?: string;
    currency?: string;
    exposureType?: string;
    riskLevel?: string;
    exposureDate?: string;
    limit?: number;
  } = {}): Promise<FXRiskExposure[]> {
    const { entityId, currency, exposureType, riskLevel, exposureDate, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        entity_id as "entityId",
        currency,
        base_currency as "baseCurrency",
        exposure_type as "exposureType",
        exposure_amount as "exposureAmount",
        current_rate as "currentRate",
        average_rate as "averageRate",
        unrealized_gain_loss as "unrealizedGainLoss",
        hedge_percentage as "hedgePercentage",
        hedge_instrument as "hedgeInstrument",
        risk_level as "riskLevel",
        volatility_30d as "volatility30d",
        volatility_90d as "volatility90d",
        var_95_1d as "var95_1d",
        exposure_date as "exposureDate",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM fx_risk_exposure
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (entityId) {
      query += ` AND entity_id = '${entityId}'`;
    }
    
    if (currency) {
      query += ` AND currency = '${currency}'`;
    }
    
    if (exposureType) {
      query += ` AND exposure_type = '${exposureType}'`;
    }
    
    if (riskLevel) {
      query += ` AND risk_level = '${riskLevel}'`;
    }
    
    if (exposureDate) {
      query += ` AND exposure_date = '${exposureDate}'::date`;
    }
    
    query += ` ORDER BY exposure_date DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as FXRiskExposure[];
  }

  // FX Hedge Management
  async createFXHedge(data: z.infer<typeof FXHedgeSchema>): Promise<FXHedge> {
    const validated = FXHedgeSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO fx_hedges (
        id,
        business_account_id,
        entity_id,
        hedge_type,
        currency,
        base_currency,
        hedge_amount,
        hedge_rate,
        maturity_date,
        counterparty,
        hedge_instrument,
        status,
        cost,
        effectiveness,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.entityId || null}::uuid,
        ${validated.hedgeType}::varchar,
        ${validated.currency}::varchar,
        ${validated.baseCurrency}::varchar,
        ${validated.hedgeAmount}::decimal,
        ${validated.hedgeRate}::decimal,
        ${validated.maturityDate}::date,
        ${validated.counterparty || null}::varchar,
        ${validated.hedgeInstrument || null}::varchar,
        ${validated.status}::varchar,
        ${validated.cost}::decimal,
        ${validated.effectiveness}::decimal,
        ${validated.createdBy}::uuid
      ) RETURNING id
    `;
    
    const hedgeId = (result as any)[0]?.id;
    return this.getFXHedge(hedgeId);
  }

  async getFXHedge(hedgeId: string): Promise<FXHedge> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        entity_id as "entityId",
        hedge_type as "hedgeType",
        currency,
        base_currency as "baseCurrency",
        hedge_amount as "hedgeAmount",
        hedge_rate as "hedgeRate",
        maturity_date as "maturityDate",
        counterparty,
        hedge_instrument as "hedgeInstrument",
        status,
        cost,
        effectiveness,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM fx_hedges
      WHERE id = ${hedgeId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getFXHedges(businessAccountId: string, filters: {
    entityId?: string;
    currency?: string;
    hedgeType?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<FXHedge[]> {
    const { entityId, currency, hedgeType, status, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        entity_id as "entityId",
        hedge_type as "hedgeType",
        currency,
        base_currency as "baseCurrency",
        hedge_amount as "hedgeAmount",
        hedge_rate as "hedgeRate",
        maturity_date as "maturityDate",
        counterparty,
        hedge_instrument as "hedgeInstrument",
        status,
        cost,
        effectiveness,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM fx_hedges
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (entityId) {
      query += ` AND entity_id = '${entityId}'`;
    }
    
    if (currency) {
      query += ` AND currency = '${currency}'`;
    }
    
    if (hedgeType) {
      query += ` AND hedge_type = '${hedgeType}'`;
    }
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as FXHedge[];
  }

  // FX Risk Analysis
  async calculateFXRiskMetrics(businessAccountId: string): Promise<FXRiskMetrics> {
    const exposures = await this.getFXRiskExposures(businessAccountId, { limit: 1000 });
    const hedges = await this.getFXHedges(businessAccountId, { limit: 1000 });
    
    const totalExposure = exposures.reduce((sum, exp) => sum + exp.exposureAmount, 0);
    const totalUnrealizedGL = exposures.reduce((sum, exp) => sum + exp.unrealizedGainLoss, 0);
    
    // Calculate hedge coverage
    const totalHedgeAmount = hedges.reduce((sum, hedge) => sum + hedge.hedgeAmount, 0);
    const hedgeCoverage = totalExposure > 0 ? (totalHedgeAmount / totalExposure) * 100 : 0;
    
    // Calculate weighted volatility
    const weightedVolatility = exposures.reduce((sum, exp) => {
      const weight = exp.exposureAmount / totalExposure;
      return sum + (weight * exp.volatility30d);
    }, 0);
    
    // Calculate total VaR
    const totalVar95_1d = exposures.reduce((sum, exp) => sum + exp.var95_1d, 0);
    
    // Count high and critical risks
    const highRiskCount = exposures.filter(exp => exp.riskLevel === 'high').length;
    const criticalRiskCount = exposures.filter(exp => exp.riskLevel === 'critical').length;
    
    // Calculate concentration risk
    const concentrationRisk = this.calculateConcentrationRisk(exposures);
    
    // Calculate correlation risk
    const correlationRisk = this.calculateCorrelationRisk(exposures);
    
    return {
      totalExposure,
      totalUnrealizedGL,
      hedgeCoverage,
      weightedVolatility,
      totalVar95_1d,
      highRiskCount,
      criticalRiskCount,
      concentrationRisk,
      correlationRisk
    };
  }

  async generateFXPositionReport(businessAccountId: string): Promise<FXPosition[]> {
    const exposures = await this.getFXRiskExposures(businessAccountId, { limit: 100 });
    const hedges = await this.getFXHedges(businessAccountId, { limit: 100 });
    
    const positions: FXPosition[] = [];
    
    // Group by currency
    const currencyGroups = exposures.reduce((groups, exp) => {
      if (!groups[exp.currency]) {
        groups[exp.currency] = {
          exposureAmount: 0,
          currentRate: exp.currentRate,
          unrealizedGainLoss: 0,
          hedgeAmount: 0,
          riskLevel: exp.riskLevel,
          volatility: exp.volatility30d,
          var95_1d: exp.var95_1d
        };
      }
      
      const group = groups[exp.currency];
      group.exposureAmount += exp.exposureAmount;
      group.unrealizedGainLoss += exp.unrealizedGainLoss;
      group.volatility = Math.max(group.volatility, exp.volatility30d);
      group.var95_1d += exp.var95_1d;
      
      // Update risk level to highest
      if (exp.riskLevel === 'critical' || group.riskLevel === 'critical') {
        group.riskLevel = 'critical';
      } else if (exp.riskLevel === 'high' && group.riskLevel !== 'critical') {
        group.riskLevel = 'high';
      }
      
      return groups;
    }, {} as Record<string, FXPosition>);
    
    // Add hedge amounts
    hedges.forEach(hedge => {
      if (currencyGroups[hedge.currency]) {
        currencyGroups[hedge.currency].hedgeAmount += hedge.hedgeAmount;
      }
    });
    
    // Calculate net exposure
    Object.values(currencyGroups).forEach(position => {
      position.netExposure = position.exposureAmount - position.hedgeAmount;
    });
    
    return Object.values(currencyGroups);
  }

  // Scenario Analysis
  async runFXScenarioAnalysis(
    businessAccountId: string,
    scenarioName: string,
    parameters: any
  ): Promise<FXScenarioAnalysis> {
    const currentMetrics = await this.calculateFXRiskMetrics(businessAccountId);
    
    // Apply scenario parameters
    const scenarioResults = this.applyScenarioParameters(currentMetrics, parameters);
    
    const recommendations = this.generateScenarioRecommendations(
      currentMetrics,
      scenarioResults,
      parameters
    );
    
    return {
      scenarioName,
      description: this.generateScenarioDescription(parameters),
      parameters,
      results: scenarioResults,
      recommendations
    };
  }

  // FX Alert Management
  async createFXAlert(data: z.infer<typeof FXAlertSchema>): Promise<FXAlert> {
    const validated = FXAlertSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO fx_alerts (
        id,
        business_account_id,
        entity_id,
        alert_type,
        severity,
        currency,
        title,
        description,
        threshold_value,
        current_value,
        variance_percentage,
        alert_data,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.entityId || null}::uuid,
        ${validated.alertType}::varchar,
        ${validated.severity}::varchar,
        ${validated.currency}::varchar,
        ${validated.title}::varchar,
        ${validated.description}::text,
        ${validated.thresholdValue}::decimal,
        ${validated.currentValue}::decimal,
        ${validated.variancePercentage}::decimal,
        ${JSON.stringify(validated.alertData)}::jsonb,
        ${validated.createdBy}::uuid
      ) RETURNING id
    `;
    
    const alertId = (result as any)[0]?.id;
    return this.getFXAlert(alertId);
  }

  async getFXAlert(alertId: string): Promise<FXAlert> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        entity_id as "entityId",
        alert_type as "alertType",
        severity,
        currency,
        title,
        description,
        threshold_value as "thresholdValue",
        current_value as "currentValue",
        variance_percentage as "variancePercentage",
        alert_data as "alertData",
        status,
        acknowledged_by as "acknowledgedBy",
        acknowledged_at as "acknowledgedAt",
        resolution_notes as "resolutionNotes",
        resolved_by as "resolvedBy",
        resolved_at as "resolvedAt",
        created_by as "createdBy",
        created_at as "createdAt"
      FROM fx_alerts
      WHERE id = ${alertId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getFXAlerts(businessAccountId: string, filters: {
    entityId?: string;
    currency?: string;
    alertType?: string;
    severity?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<FXAlert[]> {
    const { entityId, currency, alertType, severity, status, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        entity_id as "entityId",
        alert_type as "alertType",
        severity,
        currency,
        title,
        description,
        threshold_value as "thresholdValue",
        current_value as "currentValue",
        variance_percentage as "variancePercentage",
        alert_data as "alertData",
        status,
        acknowledged_by as "acknowledgedBy",
        acknowledged_at as "acknowledgedAt",
        resolution_notes as "resolutionNotes",
        resolved_by as "resolvedBy",
        resolved_at as "resolvedAt",
        created_by as "createdBy",
        created_at as "createdAt"
      FROM fx_alerts
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (entityId) {
      query += ` AND entity_id = '${entityId}'`;
    }
    
    if (currency) {
      query += ` AND currency = '${currency}'`;
    }
    
    if (alertType) {
      query += ` AND alert_type = '${alertType}'`;
    }
    
    if (severity) {
      query += ` AND severity = '${severity}'`;
    }
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as FXAlert[];
  }

  // Helper Methods
  private calculateUnrealizedGainLoss(
    exposureAmount: number,
    currentRate: number,
    averageRate?: number
  ): number {
    if (!averageRate) return 0;
    return exposureAmount * (currentRate - averageRate);
  }

  private calculateConcentrationRisk(exposures: FXRiskExposure[]): number {
    const totalExposure = exposures.reduce((sum, exp) => sum + exp.exposureAmount, 0);
    const currencyExposures = exposures.reduce((groups, exp) => {
      groups[exp.currency] = (groups[exp.currency] || 0) + exp.exposureAmount;
      return groups;
    }, {} as Record<string, number>);
    
    const maxSingleCurrency = Math.max(...Object.values(currencyExposures));
    return (maxSingleCurrency / totalExposure) * 100;
  }

  private calculateCorrelationRisk(exposures: FXRiskExposure[]): number {
    // Simplified correlation risk calculation
    // In practice, this would use historical correlation data
    const currencyCount = new Set(exposures.map(exp => exp.currency)).size;
    const totalExposures = exposures.length;
    
    if (currencyCount <= 1) return 0;
    if (currencyCount >= 5) return 80;
    if (currencyCount >= 3) return 50;
    return 30;
  }

  private applyScenarioParameters(currentMetrics: FXRiskMetrics, parameters: any): any {
    const results = { ...currentMetrics };
    
    // Apply shock scenarios
    if (parameters.fxShock) {
      results.totalUnrealizedGL *= (1 + parameters.fxShock);
    }
    
    // Apply volatility changes
    if (parameters.volatilityMultiplier) {
      results.weightedVolatility *= parameters.volatilityMultiplier;
      results.totalVar95_1d *= parameters.volatilityMultiplier;
    }
    
    // Apply hedge changes
    if (parameters.hedgeAdjustment) {
      results.hedgeCoverage = Math.max(0, Math.min(100, results.hedgeCoverage + parameters.hedgeAdjustment));
    }
    
    return results;
  }

  private generateScenarioDescription(parameters: any): string {
    const descriptions = [];
    
    if (parameters.fxShock) {
      descriptions.push(`FX shock: ${parameters.fxShock * 100}%`);
    }
    
    if (parameters.volatilityMultiplier) {
      descriptions.push(`Volatility multiplier: ${parameters.volatilityMultiplier}x`);
    }
    
    if (parameters.hedgeAdjustment) {
      descriptions.push(`Hedge adjustment: ${parameters.hedgeAdjustment * 100}%`);
    }
    
    return descriptions.join(', ') || 'Standard scenario';
  }

  private generateScenarioRecommendations(
    currentMetrics: FXRiskMetrics,
    scenarioResults: any,
    parameters: any
  ): string[] {
    const recommendations = [];
    
    if (scenarioResults.totalUnrealizedGL < currentMetrics.totalUnrealizedGL * 0.8) {
      recommendations.push('Consider increasing hedge coverage');
    }
    
    if (scenarioResults.weightedVolatility > currentMetrics.weightedVolatility * 1.5) {
      recommendations.push('Review volatility risk management');
    }
    
    if (scenarioResults.totalVar95_1d > currentMetrics.totalVar95_1d * 2) {
      recommendations.push('Implement additional risk mitigation measures');
    }
    
    return recommendations;
  }

  // Automated Alert Generation
  async generateFXAlerts(businessAccountId: string): Promise<FXAlert[]> {
    const alerts: FXAlert[] = [];
    const exposures = await this.getFXRiskExposures(businessAccountId, { limit: 100 });
    
    // Check for volatility spikes
    const highVolatilityExposures = exposures.filter(exp => exp.volatility30d > 0.05);
    for (const exposure of highVolatilityExposures) {
      const alert = await this.createFXAlert({
        businessAccountId,
        entityId: exposure.entityId,
        alertType: 'volatility_spike',
        severity: exposure.volatility30d > 0.1 ? 'high' : 'medium',
        currency: exposure.currency,
        title: `High Volatility Alert - ${exposure.currency}`,
        description: `30-day volatility of ${(exposure.volatility30d * 100).toFixed(2)}% detected for ${exposure.currency}`,
        thresholdValue: 0.05,
        currentValue: exposure.volatility30d,
        variancePercentage: ((exposure.volatility30d - 0.05) / 0.05) * 100,
        alertData: { exposureId: exposure.id },
        createdBy: 'system'
      });
      alerts.push(alert);
    }
    
    // Check for VaR breaches
    const highVarExposures = exposures.filter(exp => exp.var95_1d > 100000);
    for (const exposure of highVarExposures) {
      const alert = await this.createFXAlert({
        businessAccountId,
        entityId: exposure.entityId,
        alertType: 'var_breach',
        severity: exposure.var95_1d > 500000 ? 'critical' : 'high',
        currency: exposure.currency,
        title: `VaR Breach Alert - ${exposure.currency}`,
        description: `95% 1-day VaR of $${exposure.var95_1d.toLocaleString()} exceeds threshold`,
        thresholdValue: 100000,
        currentValue: exposure.var95_1d,
        variancePercentage: ((exposure.var95_1d - 100000) / 100000) * 100,
        alertData: { exposureId: exposure.id },
        createdBy: 'system'
      });
      alerts.push(alert);
    }
    
    return alerts;
  }

  // Hedge Effectiveness Analysis
  async analyzeHedgeEffectiveness(businessAccountId: string): Promise<any> {
    const exposures = await this.getFXRiskExposures(businessAccountId, { limit: 100 });
    const hedges = await this.getFXHedges(businessAccountId, { limit: 100 });
    
    const effectiveness = {
      overall: 0,
      byCurrency: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      recommendations: [] as string[]
    };
    
    // Calculate overall effectiveness
    const totalUnhedgedGL = exposures
      .filter(exp => exp.hedgePercentage === 0)
      .reduce((sum, exp) => sum + Math.abs(exp.unrealizedGainLoss), 0);
    
    const totalHedgedGL = exposures
      .filter(exp => exp.hedgePercentage > 0)
      .reduce((sum, exp) => sum + Math.abs(exp.unrealizedGainLoss), 0);
    
    const totalGL = totalUnhedgedGL + totalHedgedGL;
    effectiveness.overall = totalGL > 0 ? (totalHedgedGL / totalGL) * 100 : 0;
    
    // Generate recommendations
    if (effectiveness.overall < 50) {
      effectiveness.recommendations.push('Consider increasing hedge coverage');
    }
    
    if (effectiveness.overall > 80) {
      effectiveness.recommendations.push('Hedge effectiveness is optimal');
    }
    
    return effectiveness;
  }
}
