import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

export interface FinancialAssumption {
  id: string;
  businessAccountId: string;
  assumptionCategory: string;
  assumptionName: string;
  assumptionKey: string;
  assumptionValue: number;
  assumptionType: string;
  unitOfMeasure?: string;
  description?: string;
  isActive: boolean;
  isEditable: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  version: number;
}

export interface CreateAssumptionRequest {
  businessAccountId: string;
  assumptionCategory: string;
  assumptionName: string;
  assumptionKey: string;
  assumptionValue: number;
  assumptionType: string;
  unitOfMeasure?: string;
  description?: string;
  isEditable?: boolean;
  createdBy?: string;
}

export interface UpdateAssumptionRequest {
  assumptionValue?: number;
  description?: string;
  isActive?: boolean;
  isEditable?: boolean;
  updatedBy?: string;
  changeReason?: string;
}

export class FinancialAssumptionsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create default financial assumptions for a business
   */
  async createDefaultAssumptions(businessAccountId: string, userId: string): Promise<FinancialAssumption[]> {
    try {
      logger.info(`Creating default financial assumptions for business: ${businessAccountId}`);

      // Call the database function to create default assumptions
      await this.prisma.$executeRaw`SELECT create_default_financial_assumptions(${businessAccountId}, ${userId})`;

      // Retrieve the created assumptions
      const assumptions = await this.prisma.financialAssumption.findMany({
        where: {
          businessAccountId,
          isActive: true,
          version: 1
        },
        orderBy: [
          { assumptionCategory: 'asc' },
          { assumptionName: 'asc' }
        ]
      });

      logger.info(`Created ${assumptions.length} default financial assumptions for business: ${businessAccountId}`);
      return assumptions as FinancialAssumption[];
    } catch (error) {
      logger.error('Failed to create default financial assumptions:', error);
      throw error;
    }
  }

  /**
   * Get all financial assumptions for a business
   */
  async getAssumptions(
    businessAccountId: string,
    filters: {
      category?: string;
      isActive?: boolean;
      isEditable?: boolean;
      version?: number;
    } = {}
  ): Promise<FinancialAssumption[]> {
    try {
      const where: any = { businessAccountId };

      if (filters.category) where.assumptionCategory = filters.category;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;
      if (filters.isEditable !== undefined) where.isEditable = filters.isEditable;
      if (filters.version) where.version = filters.version;

      const assumptions = await this.prisma.financialAssumption.findMany({
        where,
        orderBy: [
          { assumptionCategory: 'asc' },
          { assumptionName: 'asc' }
        ]
      });

      return assumptions as FinancialAssumption[];
    } catch (error) {
      logger.error('Failed to get financial assumptions:', error);
      throw error;
    }
  }

  /**
   * Get a single financial assumption by key
   */
  async getAssumptionByKey(
    businessAccountId: string,
    assumptionKey: string,
    version?: number
  ): Promise<FinancialAssumption | null> {
    try {
      const where: any = { 
        businessAccountId, 
        assumptionKey 
      };

      if (version) {
        where.version = version;
      } else {
        // Get the latest version
        where.version = await this.getLatestVersion(businessAccountId, assumptionKey);
      }

      const assumption = await this.prisma.financialAssumption.findFirst({
        where
      });

      return assumption as FinancialAssumption | null;
    } catch (error) {
      logger.error('Failed to get financial assumption:', error);
      throw error;
    }
  }

  /**
   * Create a new financial assumption
   */
  async createAssumption(request: CreateAssumptionRequest): Promise<FinancialAssumption> {
    try {
      logger.info(`Creating financial assumption: ${request.assumptionKey} for business: ${request.businessAccountId}`);

      // Check if assumption already exists
      const existing = await this.prisma.financialAssumption.findFirst({
        where: {
          businessAccountId: request.businessAccountId,
          assumptionKey: request.assumptionKey,
          version: 1
        }
      });

      if (existing) {
        throw new Error(`Assumption with key '${request.assumptionKey}' already exists`);
      }

      const assumption = await this.prisma.financialAssumption.create({
        data: {
          businessAccountId: request.businessAccountId,
          assumptionCategory: request.assumptionCategory,
          assumptionName: request.assumptionName,
          assumptionKey: request.assumptionKey,
          assumptionValue: request.assumptionValue,
          assumptionType: request.assumptionType,
          unitOfMeasure: request.unitOfMeasure,
          description: request.description,
          isEditable: request.isEditable ?? true,
          createdBy: request.createdBy,
          version: 1
        }
      });

      logger.info(`Created financial assumption: ${assumption.id}`);
      return assumption as FinancialAssumption;
    } catch (error) {
      logger.error('Failed to create financial assumption:', error);
      throw error;
    }
  }

  /**
   * Update a financial assumption
   */
  async updateAssumption(
    businessAccountId: string,
    assumptionKey: string,
    request: UpdateAssumptionRequest
  ): Promise<FinancialAssumption> {
    try {
      logger.info(`Updating financial assumption: ${assumptionKey} for business: ${businessAccountId}`);

      const currentAssumption = await this.prisma.financialAssumption.findFirst({
        where: {
          businessAccountId,
          assumptionKey,
          isActive: true
        },
        orderBy: { version: 'desc' }
      });

      if (!currentAssumption) {
        throw new Error(`Assumption with key '${assumptionKey}' not found`);
      }

      if (!currentAssumption.isEditable) {
        throw new Error(`Assumption with key '${assumptionKey}' is not editable`);
      }

      // Store old value in history if value changed
      if (request.assumptionValue !== undefined && request.assumptionValue !== currentAssumption.assumptionValue.toNumber()) {
        await this.prisma.forecastAssumptionsHistory.create({
          data: {
            businessAccountId,
            assumptionId: currentAssumption.id,
            assumptionKey,
            oldValue: currentAssumption.assumptionValue,
            newValue: request.assumptionValue,
            changeReason: request.changeReason,
            changedBy: request.updatedBy
          }
        });
      }

      // Update the assumption
      const updatedAssumption = await this.prisma.financialAssumption.update({
        where: { id: currentAssumption.id },
        data: {
          ...(request.assumptionValue !== undefined && { assumptionValue: request.assumptionValue }),
          ...(request.description !== undefined && { description: request.description }),
          ...(request.isActive !== undefined && { isActive: request.isActive }),
          ...(request.isEditable !== undefined && { isEditable: request.isEditable }),
          ...(request.updatedBy && { updatedBy: request.updatedBy })
        }
      });

      logger.info(`Updated financial assumption: ${updatedAssumption.id}`);
      return updatedAssumption as FinancialAssumption;
    } catch (error) {
      logger.error('Failed to update financial assumption:', error);
      throw error;
    }
  }

  /**
   * Create a new version of an assumption (versioning)
   */
  async createAssumptionVersion(
    businessAccountId: string,
    assumptionKey: string,
    newVersion: number,
    request: UpdateAssumptionRequest
  ): Promise<FinancialAssumption> {
    try {
      logger.info(`Creating new version ${newVersion} for assumption: ${assumptionKey}`);

      const currentAssumption = await this.prisma.financialAssumption.findFirst({
        where: {
          businessAccountId,
          assumptionKey,
          isActive: true
        },
        orderBy: { version: 'desc' }
      });

      if (!currentAssumption) {
        throw new Error(`Assumption with key '${assumptionKey}' not found`);
      }

      // Store old value in history
      if (request.assumptionValue !== undefined) {
        await this.prisma.forecastAssumptionsHistory.create({
          data: {
            businessAccountId,
            assumptionId: currentAssumption.id,
            assumptionKey,
            oldValue: currentAssumption.assumptionValue,
            newValue: request.assumptionValue,
            changeReason: request.changeReason,
            changedBy: request.updatedBy
          }
        });
      }

      // Create new version
      const newAssumption = await this.prisma.financialAssumption.create({
        data: {
          businessAccountId,
          assumptionCategory: currentAssumption.assumptionCategory,
          assumptionName: currentAssumption.assumptionName,
          assumptionKey,
          assumptionValue: request.assumptionValue ?? currentAssumption.assumptionValue,
          assumptionType: currentAssumption.assumptionType,
          unitOfMeasure: currentAssumption.unitOfMeasure,
          description: request.description ?? currentAssumption.description,
          isActive: true,
          isEditable: request.isEditable ?? currentAssumption.isEditable,
          createdBy: currentAssumption.createdBy,
          updatedBy: request.updatedBy,
          version: newVersion
        }
      });

      // Deactivate old version
      await this.prisma.financialAssumption.update({
        where: { id: currentAssumption.id },
        data: { isActive: false }
      });

      logger.info(`Created new version ${newVersion} for assumption: ${assumptionKey}`);
      return newAssumption as FinancialAssumption;
    } catch (error) {
      logger.error('Failed to create assumption version:', error);
      throw error;
    }
  }

  /**
   * Delete a financial assumption
   */
  async deleteAssumption(businessAccountId: string, assumptionKey: string): Promise<void> {
    try {
      logger.info(`Deleting financial assumption: ${assumptionKey} for business: ${businessAccountId}`);

      const assumption = await this.prisma.financialAssumption.findFirst({
        where: {
          businessAccountId,
          assumptionKey,
          isActive: true
        }
      });

      if (!assumption) {
        throw new Error(`Assumption with key '${assumptionKey}' not found`);
      }

      if (!assumption.isEditable) {
        throw new Error(`Assumption with key '${assumptionKey}' is not editable`);
      }

      // Soft delete by deactivating
      await this.prisma.financialAssumption.update({
        where: { id: assumption.id },
        data: { isActive: false }
      });

      logger.info(`Deleted financial assumption: ${assumptionKey}`);
    } catch (error) {
      logger.error('Failed to delete financial assumption:', error);
      throw error;
    }
  }

  /**
   * Get assumptions history
   */
  async getAssumptionsHistory(
    businessAccountId: string,
    filters: {
      assumptionKey?: string;
      startDate?: Date;
      endDate?: Date;
      changedBy?: string;
    } = {}
  ): Promise<any[]> {
    try {
      const where: any = { businessAccountId };

      if (filters.assumptionKey) where.assumptionKey = filters.assumptionKey;
      if (filters.startDate || filters.endDate) {
        where.changedAt = {};
        if (filters.startDate) where.changedAt.gte = filters.startDate;
        if (filters.endDate) where.changedAt.lte = filters.endDate;
      }
      if (filters.changedBy) where.changedBy = filters.changedBy;

      const history = await this.prisma.forecastAssumptionsHistory.findMany({
        where,
        include: {
          changer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { changedAt: 'desc' }
      });

      return history;
    } catch (error) {
      logger.error('Failed to get assumptions history:', error);
      throw error;
    }
  }

  /**
   * Get assumptions by category
   */
  async getAssumptionsByCategory(businessAccountId: string): Promise<Record<string, FinancialAssumption[]>> {
    try {
      const assumptions = await this.getAssumptions(businessAccountId, { isActive: true });

      const grouped: Record<string, FinancialAssumption[]> = {};
      
      assumptions.forEach(assumption => {
        if (!grouped[assumption.assumptionCategory]) {
          grouped[assumption.assumptionCategory] = [];
        }
        grouped[assumption.assumptionCategory].push(assumption);
      });

      return grouped;
    } catch (error) {
      logger.error('Failed to get assumptions by category:', error);
      throw error;
    }
  }

  /**
   * Validate assumptions
   */
  async validateAssumptions(businessAccountId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const assumptions = await this.getAssumptions(businessAccountId, { isActive: true });
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check required assumptions
      const requiredKeys = [
        'revenue_growth_rate',
        'cogs_percentage',
        'sga_percentage',
        'tax_rate',
        'dso',
        'dio',
        'dpo'
      ];

      const existingKeys = assumptions.map(a => a.assumptionKey);

      requiredKeys.forEach(key => {
        if (!existingKeys.includes(key)) {
          errors.push(`Required assumption '${key}' is missing`);
        }
      });

      // Validate assumption values
      assumptions.forEach(assumption => {
        const value = assumption.assumptionValue;

        switch (assumption.assumptionType) {
          case 'PERCENTAGE':
            if (value < 0 || value > 100) {
              errors.push(`Percentage assumption '${assumption.assumptionKey}' must be between 0 and 100`);
            }
            break;
          case 'GROWTH_RATE':
            if (value < -100 || value > 1000) {
              warnings.push(`Growth rate assumption '${assumption.assumptionKey}' seems unusual: ${value}%`);
            }
            break;
          case 'DAYS':
            if (value < 0 || value > 365) {
              errors.push(`Days assumption '${assumption.assumptionKey}' must be between 0 and 365`);
            }
            break;
          case 'RATIO':
            if (value < 0) {
              errors.push(`Ratio assumption '${assumption.assumptionKey}' must be positive`);
            }
            break;
        }
      });

      // Check logical consistency
      const cogsAssumption = assumptions.find(a => a.assumptionKey === 'cogs_percentage');
      const sgaAssumption = assumptions.find(a => a.assumptionKey === 'sga_percentage');
      const rdAssumption = assumptions.find(a => a.assumptionKey === 'rd_percentage');
      const marketingAssumption = assumptions.find(a => a.assumptionKey === 'marketing_percentage');

      if (cogsAssumption && sgaAssumption && rdAssumption && marketingAssumption) {
        const totalExpensePercentage = cogsAssumption.assumptionValue + 
                                   sgaAssumption.assumptionValue + 
                                   rdAssumption.assumptionValue + 
                                   marketingAssumption.assumptionValue;

        if (totalExpensePercentage > 100) {
          warnings.push(`Total expense percentage (${totalExpensePercentage}%) exceeds 100% of revenue`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logger.error('Failed to validate assumptions:', error);
      throw error;
    }
  }

  /**
   * Get latest version of an assumption
   */
  private async getLatestVersion(businessAccountId: string, assumptionKey: string): Promise<number> {
    const latest = await this.prisma.financialAssumption.findFirst({
        where: {
    businessAccountId: string,
    updates: Array<{
      assumptionKey: string;
      assumptionValue: number;
      changeReason?: string;
    }>,
    updatedBy: string
  ): Promise<FinancialAssumption[]> {
    try {
      logger.info(`Bulk updating ${updates.length} assumptions for business: ${businessAccountId}`);

      const updatedAssumptions: FinancialAssumption[] = [];

      for (const update of updates) {
        const updateRequest: UpdateAssumptionRequest = {
          assumptionValue: update.assumptionValue,
          updatedBy
        };
        
        if (update.changeReason) {
          updateRequest.changeReason = update.changeReason;
        }

        const updated = await this.updateAssumption(
          businessAccountId,
          update.assumptionKey,
          updateRequest
        );
        updatedAssumptions.push(updated);
      }

      logger.info(`Successfully updated ${updatedAssumptions.length} assumptions`);
      return updatedAssumptions;
    } catch (error) {
      logger.error('Failed to bulk update assumptions:', error);
      throw error;
    }
  }

  /**
   * Export assumptions to JSON
   */
  async exportAssumptions(businessAccountId: string): Promise<any> {
    try {
      const assumptions = await this.getAssumptions(businessAccountId, { isActive: true });
      
      const exportData = {
        businessAccountId,
        exportedAt: new Date().toISOString(),
        assumptions: assumptions.map(a => ({
          category: a.assumptionCategory,
          name: a.assumptionName,
          key: a.assumptionKey,
          value: a.assumptionValue,
          type: a.assumptionType,
          unit: a.unitOfMeasure,
          description: a.description,
          isEditable: a.isEditable
        }))
      };

      return exportData;
    } catch (error) {
      logger.error('Failed to export assumptions:', error);
      throw error;
    }
  }

  /**
   * Import assumptions from JSON
   */
  async importAssumptions(
    businessAccountId: string,
    importData: any,
    userId: string,
    options: {
      overwriteExisting?: boolean;
      createNewVersion?: boolean;
    } = {}
  ): Promise<FinancialAssumption[]> {
    try {
      logger.info(`Importing assumptions for business: ${businessAccountId}`);

      if (!importData.assumptions || !Array.isArray(importData.assumptions)) {
        throw new Error('Invalid import data format');
      }

      const importedAssumptions: FinancialAssumption[] = [];

      for (const assumptionData of importData.assumptions) {
        const existing = await this.getAssumptionByKey(businessAccountId, assumptionData.key);

        if (existing) {
          if (options.overwriteExisting) {
            if (options.createNewVersion) {
              const latestVersion = await this.getLatestVersion(businessAccountId, assumptionData.key);
              const updated = await this.createAssumptionVersion(
                businessAccountId,
                assumptionData.key,
                latestVersion + 1,
                {
                  assumptionValue: assumptionData.value,
                  description: assumptionData.description,
                  updatedBy: userId,
                  changeReason: 'Imported from JSON'
                }
              );
              importedAssumptions.push(updated);
            } else {
              const updated = await this.updateAssumption(
                businessAccountId,
                assumptionData.key,
                {
                  assumptionValue: assumptionData.value,
                  description: assumptionData.description,
                  updatedBy: userId,
                  changeReason: 'Imported from JSON'
                }
              );
              importedAssumptions.push(updated);
            }
          }
        } else {
          const created = await this.createAssumption({
            businessAccountId,
            assumptionCategory: assumptionData.category,
            assumptionName: assumptionData.name,
            assumptionKey: assumptionData.key,
            assumptionValue: assumptionData.value,
            assumptionType: assumptionData.type,
            unitOfMeasure: assumptionData.unit,
            description: assumptionData.description,
            isEditable: assumptionData.isEditable,
            createdBy: userId
          });
          importedAssumptions.push(created);
        }
      }

      logger.info(`Successfully imported ${importedAssumptions.length} assumptions`);
      return importedAssumptions;
    } catch (error) {
      logger.error('Failed to import assumptions:', error);
      throw error;
    }
  }
}
