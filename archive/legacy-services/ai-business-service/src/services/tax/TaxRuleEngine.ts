import { MultiCountryTaxService, CountryTaxConfig, TaxRule, TransactionTaxMapping } from './MultiCountryTaxService';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface TaxCalculationRequest {
  businessAccountId: string;
  transactionId: string;
  transactionType: string;
  transactionCategory: string;
  amount: number;
  currency: string;
  date: Date;
  sourceCountry?: string;
  destinationCountry?: string;
  isCrossBorder: boolean;
  additionalData?: Record<string, any>;
}

export interface TaxCalculationResult {
  success: boolean;
  taxMappings: TransactionTaxMapping[];
  totalTaxLiability: number;
  currency: string;
  exchangeRates: Record<string, number>;
  calculationDetails: Record<string, any>;
  errors?: string[];
  warnings?: string[];
}

export interface TaxRuleApplication {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  taxRate: number;
  taxableAmount: number;
  calculatedTax: number;
  conditions: Record<string, any>;
  exemptions: any[];
  priority: number;
}

export interface TaxExposureCalculation {
  countryId: string;
  countryCode: string;
  periodStart: Date;
  periodEnd: Date;
  totalRevenue: number;
  totalExpenses: number;
  taxableIncome: number;
  estimatedTaxLiability: number;
  paidTax: number;
  outstandingLiability: number;
  riskScore: number;
  riskLevel: string;
  factors: Record<string, any>;
}

export class TaxRuleEngine {
  private taxService: MultiCountryTaxService;

  constructor() {
    this.taxService = new MultiCountryTaxService();
  }

  async calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
    const taxMappings: TransactionTaxMapping[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let totalTaxLiability = 0;
    const exchangeRates: Record<string, number> = {};
    const calculationDetails: Record<string, any> = {};

    try {
      // Step 1: Determine applicable tax jurisdictions
      const applicableCountries = await this.determineApplicableCountries(request);
      calculationDetails.applicableCountries = applicableCountries;

      // Step 2: Get exchange rates
      for (const country of applicableCountries) {
        exchangeRates[country.countryCode] = await this.getExchangeRate(
          request.currency,
          country.currency,
          request.date
        );
      }

      // Step 3: Apply tax rules for each jurisdiction
      for (const country of applicableCountries) {
        const countryTaxMappings = await this.applyCountryTaxRules(
          request,
          country,
          exchangeRates[country.countryCode]
        );
        
        taxMappings.push(...countryTaxMappings);
        totalTaxLiability += countryTaxMappings.reduce(
          (sum, mapping) => sum + mapping.calculatedTax, 0
        );
      }

      // Step 4: Handle cross-border specific rules
      if (request.isCrossBorder) {
        const crossBorderAdjustments = await this.applyCrossBorderRules(
          request,
          taxMappings,
          exchangeRates
        );
        
        taxMappings.push(...crossBorderAdjustments);
        totalTaxLiability += crossBorderAdjustments.reduce(
          (sum, mapping) => sum + mapping.calculatedTax, 0
        );
        
        calculationDetails.crossBorderAdjustments = crossBorderAdjustments;
      }

      // Step 5: Apply tax treaties if applicable
      if (request.sourceCountry && request.destinationCountry) {
        const treatyAdjustments = await this.applyTaxTreaties(
          request,
          taxMappings,
          exchangeRates
        );
        
        if (treatyAdjustments.length > 0) {
          // Adjust existing mappings based on treaty
          for (const adjustment of treatyAdjustments) {
            const existingIndex = taxMappings.findIndex(
              m => m.countryId === adjustment.countryId && m.taxType === adjustment.taxType
            );
            
            if (existingIndex >= 0) {
              taxMappings[existingIndex].calculatedTax = adjustment.calculatedTax;
              taxMappings[existingIndex].taxRate = adjustment.taxRate;
              taxMappings[existingIndex].calculationDetails = {
                ...taxMappings[existingIndex].calculationDetails,
                treatyAdjustment: adjustment
              } as Record<string, any>;
            }
          }
          
          calculationDetails.treatyAdjustments = treatyAdjustments;
          warnings.push('Tax treaty adjustments applied');
        }
      }

      calculationDetails.totalTaxLiability = totalTaxLiability;
      calculationDetails.exchangeRates = exchangeRates;

      return {
        success: true,
        taxMappings,
        totalTaxLiability,
        currency: request.currency,
        exchangeRates,
        calculationDetails,
        warnings
      };

    } catch (error) {
      errors.push(`Tax calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        success: false,
        taxMappings: [],
        totalTaxLiability: 0,
        currency: request.currency,
        exchangeRates: {},
        calculationDetails: {},
        errors
      };
    }
  }

  async calculateTaxExposure(
    businessAccountId: string,
    countryId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<TaxExposureCalculation> {
    try {
      // Get country configuration
      const countryConfig = await this.taxService.getCountryTaxConfig(countryId);
      
      // Get all tax mappings for the period
      const taxMappings = await this.taxService.getTransactionTaxMappings(businessAccountId, {
        countryId,
        status: 'calculated'
      });

      // Calculate totals
      const totalRevenue = await this.calculateTotalRevenue(businessAccountId, periodStart, periodEnd);
      const totalExpenses = await this.calculateTotalExpenses(businessAccountId, periodStart, periodEnd);
      const taxableIncome = totalRevenue - totalExpenses;
      
      // Calculate estimated tax liability
      const estimatedTaxLiability = this.calculateEstimatedTaxLiability(
        taxableIncome,
        countryConfig.corporateTaxRate,
        countryConfig
      );
      
      // Get paid tax amount
      const paidTax = taxMappings.reduce((sum, mapping) => sum + mapping.calculatedTax, 0);
      const outstandingLiability = estimatedTaxLiability - paidTax;
      
      // Calculate risk score
      const riskFactors = await this.assessRiskFactors(businessAccountId, countryId, periodStart, periodEnd);
      const riskScore = this.calculateRiskScore(outstandingLiability, estimatedTaxLiability, riskFactors);
      const riskLevel = this.determineRiskLevel(riskScore);

      return {
        countryId,
        countryCode: countryConfig.countryCode,
        periodStart,
        periodEnd,
        totalRevenue,
        totalExpenses,
        taxableIncome,
        estimatedTaxLiability,
        paidTax,
        outstandingLiability,
        riskScore,
        riskLevel,
        factors: riskFactors
      };

    } catch (error) {
      throw new Error(`Tax exposure calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async determineApplicableCountries(request: TaxCalculationRequest): Promise<any[]> {
    const countries = [];
    
    // Always include the primary country (where business is registered)
    const primaryCountry = await this.getPrimaryCountry(request.businessAccountId);
    if (primaryCountry) {
      countries.push(primaryCountry);
    }
    
    // For cross-border transactions, include destination country
    if (request.isCrossBorder && request.destinationCountry) {
      const destinationCountry = await this.getCountryByCode(request.destinationCountry);
      if (destinationCountry) {
        countries.push(destinationCountry);
      }
    }
    
    // Check for other applicable jurisdictions based on transaction type
    const additionalJurisdictions = await this.getAdditionalJurisdictions(request);
    countries.push(...additionalJurisdictions);
    
    return countries;
  }

  private async applyCountryTaxRules(
    request: TaxCalculationRequest,
    country: any,
    exchangeRate: number
  ): Promise<TransactionTaxMapping[]> {
    const taxMappings: TransactionTaxMapping[] = [];
    
    // Get applicable tax rules for this country and transaction type
    const taxRules = await this.taxService.getTaxRules(country.id, {
      ruleType: this.getTaxRuleType(request.transactionType),
      isActive: true
    });

    for (const rule of taxRules) {
      // Check if rule conditions are met
      if (await this.evaluateRuleConditions(rule.conditions, request)) {
        const taxableAmount = await this.calculateTaxableAmount(request, rule);
        const calculatedTax = await this.calculateTaxByMethod(
          taxableAmount,
          rule,
          exchangeRate
        );

        const mapping = await this.taxService.calculateTransactionTax({
          businessAccountId: request.businessAccountId,
          transactionId: request.transactionId,
          countryId: country.id,
          taxType: rule.ruleType as 'corporate_tax' | 'vat' | 'gst' | 'withholding_tax' | 'custom_duty' | 'excise' | 'other',
          taxableAmount,
          taxRate: rule.taxRate,
          calculatedTax,
          currency: request.currency,
          exchangeRate,
          isCrossBorder: request.isCrossBorder,
          sourceCountry: request.sourceCountry,
          destinationCountry: request.destinationCountry,
          transactionType: request.transactionType,
          transactionCategory: request.transactionCategory,
          createdBy: 'system' // Would be actual user ID
        });

        taxMappings.push(mapping);
      }
    }

    return taxMappings;
  }

  private async applyCrossBorderRules(
    request: TaxCalculationRequest,
    existingMappings: TransactionTaxMapping[],
    exchangeRates: Record<string, number>
  ): Promise<TransactionTaxMapping[]> {
    const crossBorderMappings: TransactionTaxMapping[] = [];
    
    // Apply withholding tax for cross-border payments
    if (request.destinationCountry) {
      const withholdingRules = await this.taxService.getTaxRules(
        (await this.getCountryByCode(request.destinationCountry))?.id || '',
        { ruleType: 'withholding_tax', isActive: true }
      );

      for (const rule of withholdingRules) {
        const applicableAmount = this.getApplicableWithholdingAmount(request, rule);
        if (applicableAmount > 0) {
          const calculatedTax = applicableAmount * (rule.taxRate / 100);
          
          const mapping = await this.taxService.calculateTransactionTax({
            businessAccountId: request.businessAccountId,
            transactionId: request.transactionId,
            countryId: rule.countryId,
            taxType: 'withholding_tax',
            taxableAmount: applicableAmount,
            taxRate: rule.taxRate,
            calculatedTax,
            currency: request.currency,
            exchangeRate: exchangeRates[request.destinationCountry] || 1,
            isCrossBorder: true,
            sourceCountry: request.sourceCountry,
            destinationCountry: request.destinationCountry,
            transactionType: request.transactionType,
            transactionCategory: request.transactionCategory,
            createdBy: 'system'
          });

          crossBorderMappings.push(mapping);
        }
      }
    }

    return crossBorderMappings;
  }

  private async applyTaxTreaties(
    request: TaxCalculationRequest,
    existingMappings: TransactionTaxMapping[],
    exchangeRates: Record<string, number>
  ): Promise<any[]> {
    const treatyAdjustments: any[] = [];
    
    if (!request.sourceCountry || !request.destinationCountry) {
      return treatyAdjustments;
    }

    // Get applicable tax treaty
    const treaties = await this.getApplicableTaxTreaties(
      request.sourceCountry,
      request.destinationCountry
    );

    for (const treaty of treaties) {
      const withholdingRates = treaty.withholdingTaxRates;
      
      for (const mapping of existingMappings) {
        if (mapping.taxType === 'withholding_tax' && withholdingRates[mapping.transactionType]) {
          const treatyRate = withholdingRates[mapping.transactionType];
          
          if (treatyRate < mapping.taxRate) {
            treatyAdjustments.push({
              countryId: mapping.countryId,
              taxType: mapping.taxType,
              originalRate: mapping.taxRate,
              treatyRate: treatyRate,
              calculatedTax: mapping.taxableAmount * (treatyRate / 100),
              treatyName: treaty.treatyName
            });
          }
        }
      }
    }

    return treatyAdjustments;
  }

  private async evaluateRuleConditions(
    conditions: Record<string, any>,
    request: TaxCalculationRequest
  ): Promise<boolean> {
    // If no conditions, rule applies
    if (!conditions || Object.keys(conditions).length === 0) {
      return true;
    }

    // Evaluate each condition
    for (const [key, value] of Object.entries(conditions)) {
      switch (key) {
        case 'minAmount':
          if (request.amount < value) return false;
          break;
        case 'maxAmount':
          if (request.amount > value) return false;
          break;
        case 'transactionTypes':
          if (!value.includes(request.transactionType)) return false;
          break;
        case 'dateRange':
          const startDate = new Date(value.start);
          const endDate = new Date(value.end);
          if (request.date < startDate || request.date > endDate) return false;
          break;
        case 'crossBorderOnly':
          if (value && !request.isCrossBorder) return false;
          break;
        case 'specificCountries':
          if (!value.includes(request.sourceCountry) && !value.includes(request.destinationCountry)) {
            return false;
          }
          break;
      }
    }

    return true;
  }

  private async calculateTaxableAmount(
    request: TaxCalculationRequest,
    rule: TaxRule
  ): Promise<number> {
    let taxableAmount = request.amount;

    // Apply exemptions
    for (const exemption of rule.exemptions) {
      if (await this.isExempt(request, exemption)) {
        taxableAmount *= (1 - exemption.percentage / 100);
      }
    }

    return taxableAmount;
  }

  private async calculateTaxByMethod(
    taxableAmount: number,
    rule: TaxRule,
    exchangeRate: number
  ): Promise<number> {
    const adjustedAmount = taxableAmount * exchangeRate;

    switch (rule.calculationMethod) {
      case 'percentage':
        return adjustedAmount * (rule.taxRate / 100);
      
      case 'fixed_amount':
        return rule.tierRates[0]?.fixedAmount || 0;
      
      case 'tiered':
        return this.calculateTieredTax(adjustedAmount, rule.tierRates);
      
      case 'progressive':
        return this.calculateProgressiveTax(adjustedAmount, rule.tierRates);
      
      case 'reverse_calculation':
        return this.calculateReverseTax(adjustedAmount, rule.tierRates);
      
      default:
        return 0;
    }
  }

  private calculateTieredTax(amount: number, tiers: any[]): number {
    let tax = 0;
    let remainingAmount = amount;

    for (const tier of tiers.sort((a, b) => a.minAmount - b.minAmount)) {
      if (remainingAmount <= 0) break;
      
      const tierAmount = Math.min(remainingAmount, tier.maxAmount - tier.minAmount);
      tax += tierAmount * (tier.rate / 100);
      remainingAmount -= tierAmount;
    }

    return tax;
  }

  private calculateProgressiveTax(amount: number, tiers: any[]): number {
    let tax = 0;

    for (const tier of tiers.sort((a, b) => a.minAmount - b.minAmount)) {
      if (amount > tier.minAmount) {
        const taxableInTier = Math.min(amount - tier.minAmount, tier.maxAmount - tier.minAmount);
        tax += taxableInTier * (tier.rate / 100);
      }
    }

    return tax;
  }

  private calculateReverseTax(amount: number, tiers: any[]): number {
    // This is a simplified reverse calculation
    // In practice, this would be more complex
    for (const tier of tiers.sort((a, b) => b.maxAmount - a.maxAmount)) {
      if (amount >= tier.minAmount && amount <= tier.maxAmount) {
        return amount * (tier.rate / 100);
      }
    }
    return 0;
  }

  private getTaxRuleType(transactionType: string): string {
    const typeMapping: Record<string, 'corporate_tax' | 'vat' | 'gst' | 'withholding_tax' | 'custom_duty' | 'excise' | 'other'> = {
      'revenue': 'vat',
      'expense': 'corporate_tax',
      'dividend': 'withholding_tax',
      'interest': 'withholding_tax',
      'royalty': 'withholding_tax',
      'salary': 'withholding_tax',
      'import': 'custom_duty',
      'export': 'vat'
    };

    return typeMapping[transactionType] || 'corporate_tax';
  }

  private getApplicableWithholdingAmount(request: TaxCalculationRequest, rule: TaxRule): number {
    // Simplified logic - in practice this would be more sophisticated
    return request.amount;
  }

  private async isExempt(request: TaxCalculationRequest, exemption: any): Promise<boolean> {
    // Simplified exemption logic
    if (exemption.transactionTypes && !exemption.transactionTypes.includes(request.transactionType)) {
      return false;
    }
    
    if (exemption.amountThreshold && request.amount < exemption.amountThreshold) {
      return true;
    }
    
    return false;
  }

  private async getExchangeRate(fromCurrency: string, toCurrency: string, date: Date): Promise<number> {
    // This would integrate with a real exchange rate service
    // For now, return a placeholder
    if (fromCurrency === toCurrency) return 1;
    
    // Placeholder rates
    const rates: Record<string, number> = {
      'USD_EUR': 0.85,
      'USD_GBP': 0.73,
      'USD_AED': 3.67,
      'EUR_USD': 1.18,
      'GBP_USD': 1.37,
      'AED_USD': 0.27
    };
    
    return rates[`${fromCurrency}_${toCurrency}` || 1;
  }

  private async getPrimaryCountry(businessAccountId: string): Promise<any> {
    // This would get the primary country from business account configuration
    // For now, return a placeholder
    return {
      id: 'us-country-id',
      countryCode: 'US',
      countryName: 'United States',
      currency: 'USD'
    };
  }

  private async getCountryByCode(countryCode: string): Promise<any> {
    // This would get country details from the country_tax_configurations table
    // For now, return a placeholder
    const countries: Record<string, any> = {
      'US': { id: 'us-country-id', countryCode: 'US', currency: 'USD' },
      'GB': { id: 'gb-country-id', countryCode: 'GB', currency: 'GBP' },
      'AE': { id: 'ae-country-id', countryCode: 'AE', currency: 'AED' },
      'DE': { id: 'de-country-id', countryCode: 'DE', currency: 'EUR' }
    };
    
    return countries[countryCode];
  }

  private async getAdditionalJurisdictions(request: TaxCalculationRequest): Promise<any[]> {
    // This would determine additional tax jurisdictions based on transaction details
    // For now, return empty array
    return [];
  }

  private async getApplicableTaxTreaties(sourceCountry: string, destinationCountry: string): Promise<any[]> {
    // This would query the tax_treaties table
    // For now, return empty array
    return [];
  }

  private async calculateTotalRevenue(businessAccountId: string, periodStart: Date, periodEnd: Date): Promise<number> {
    // This would sum up all revenue transactions for the period
    // For now, return a placeholder
    return 1000000;
  }

  private async calculateTotalExpenses(businessAccountId: string, periodStart: Date, periodEnd: Date): Promise<number> {
    // This would sum up all expense transactions for the period
    // For now, return a placeholder
    return 600000;
  }

  private calculateEstimatedTaxLiability(
    taxableIncome: number,
    corporateTaxRate: number,
    countryConfig: CountryTaxConfig
  ): number {
    // Apply progressive tax rates if configured
    if (countryConfig.withholdingTaxRates?.corporate?.tiered) {
      return this.calculateTieredTax(taxableIncome, countryConfig.withholdingTaxRates.corporate.tiered);
    }
    
    return Math.max(0, taxableIncome * corporateTaxRate);
  }

  private async assessRiskFactors(
    businessAccountId: string,
    countryId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<Record<string, any>> {
    // This would assess various risk factors
    return {
      crossBorderRisk: 0.3,
      complexityRisk: 0.2,
      regulatoryRisk: 0.1,
      complianceHistory: 0.1,
      auditRisk: 0.05
    };
  }

  private calculateRiskScore(
    outstandingLiability: number,
    estimatedTaxLiability: number,
    riskFactors: Record<string, any>
  ): number {
    let score = 0;
    
    // Base score from outstanding liability
    if (estimatedTaxLiability > 0) {
      score += Math.min((outstandingLiability / estimatedTaxLiability) * 50, 50);
    }
    
    // Add risk factors
    Object.values(riskFactors).forEach(factor => {
      score += factor * 10;
    });
    
    return Math.min(score, 100);
  }

  private determineRiskLevel(score: number): string {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
}
