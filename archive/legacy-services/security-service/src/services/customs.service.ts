// Customs Warnings Service
// Service d'avertissements douaniers

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { PrismaClient, CustomsWarningResult, CustomsCheckRequest } from '@prisma/client';

const prisma = new PrismaClient();

export class CustomsService {
  private readonly customsApiKey?: string;
  private readonly customsApiUrl?: string;

  constructor() {
    this.customsApiKey = process.env.CUSTOMS_API_KEY;
    this.customsApiUrl = process.env.CUSTOMS_API_URL;
  }

  /**
   * Get customs warnings for a country
   */
  async getCountryWarnings(countryCode: string): Promise<CustomsWarningResult> {
    try {
      const regulations = await prisma.customsRegulation.findMany({
        where: {
          countryCode: countryCode.toUpperCase(),
          isActive: true
        },
        orderBy: [
          { isActive: 'desc' },
          { effectiveDate: 'desc' }
        ]
      });

      const warnings = await prisma.customsWarning.findMany({
        where: {
          countryCode: countryCode.toUpperCase(),
          isActive: true,
          OR: [
            { effectiveFrom: null },
            { effectiveFrom: { lte: new Date() } }
          ],
          AND: [
            {
              OR: [
                { effectiveUntil: null },
                { effectiveUntil: { gte: new Date() } }
              ]
            }
          ]
        },
        orderBy: { severity: 'desc' }
      });

      // Get country info from first regulation or create default
      const countryInfo = regulations[0] || {
        countryName: this.getCountryName(countryCode),
        countryCode: countryCode.toUpperCase()
      };

      return {
        country: countryInfo.countryName,
        countryCode: countryInfo.countryCode,
        warnings: warnings.map(w => ({
          id: w.id,
          type: w.warningType,
          severity: w.severity,
          title: w.title,
          message: w.message,
          requiredActions: w.requiredActions,
          links: (w.links as any) || []
        })),
        generalRequirements: this.extractGeneralRequirements(regulations),
        applicableRegulations: regulations.map(r => ({
          id: r.id,
          title: r.title,
          category: r.category,
          description: r.description,
          requiredDocuments: r.requiredDocuments,
          dutyRate: (r.dutyRates as any)?.rate,
          taxRate: (r.taxRates as any)?.vat,
          officialLink: r.officialLink || undefined
        }))
      };
    } catch (error) {
      logger.error('Failed to get country warnings', { error, countryCode });
      throw error;
    }
  }

  /**
   * Check customs requirements for a shipment
   */
  async checkShipmentRequirements(
    request: CustomsCheckRequest
  ): Promise<{
    warnings: any[];
    restrictions: any[];
    requirements: any[];
    estimatedDuties?: number;
  }> {
    try {
      const warnings: any[] = [];
      const restrictions: any[] = [];
      const requirements: any[] = [];

      // Get destination country regulations
      const destinationRegulations = await prisma.customsRegulation.findMany({
        where: {
          countryCode: request.destinationCountry.toUpperCase(),
          isActive: true
        }
      });

      // Check for product-specific warnings
      const productWarnings = await prisma.customsWarning.findMany({
        where: {
          countryCode: request.destinationCountry.toUpperCase(),
          isActive: true,
          OR: [
            { productCategories: { has: request.productCategory } },
            { hsCodes: { has: request.hsCode } }
          ]
        }
      });

      for (const warning of productWarnings) {
        warnings.push({
          id: warning.id,
          type: warning.warningType,
          severity: warning.severity,
          title: warning.title,
          message: warning.message,
          actions: warning.requiredActions
        });
      }

      // Check for restrictions
      for (const regulation of destinationRegulations) {
        const restrictedItems = (regulation.restrictedItems as string[]) || [];
        const prohibitedItems = (regulation.prohibitedItems as string[]) || [];

        if (prohibitedItems.includes(request.productCategory)) {
          restrictions.push({
            type: 'PROHIBITED',
            item: request.productCategory,
            regulation: regulation.title,
            message: `This product is prohibited from import into ${regulation.countryName}`
          });
        }

        if (restrictedItems.includes(request.productCategory)) {
          restrictions.push({
            type: 'RESTRICTED',
            item: request.productCategory,
            regulation: regulation.title,
            message: `This product requires special permits for import`
          });
        }
      }

      // Calculate estimated duties
      const applicableRegulation = destinationRegulations.find(r => {
        const categories = (r.restrictedItems as string[]) || [];
        return categories.includes(request.productCategory) || 
               (r.category === 'TAXABLE' && !categories.includes(request.productCategory));
      });

      let estimatedDuties: number | undefined;
      if (applicableRegulation) {
        const dutyRates = (applicableRegulation.dutyRates as any) || {};
        const taxRates = (applicableRegulation.taxRates as any) || {};
        
        const dutyRate = parseFloat(dutyRates.rate?.replace('%', '') || '0');
        const taxRate = parseFloat(taxRates.vat?.replace('%', '') || '0');
        
        const duties = request.productValue * (dutyRate / 100);
        const taxes = request.productValue * (taxRate / 100);
        
        estimatedDuties = duties + taxes;
      }

      // Gather requirements
      for (const regulation of destinationRegulations) {
        const docs = (regulation.requiredDocuments as string[]) || [];
        if (docs.length > 0) {
          requirements.push({
            regulation: regulation.title,
            documents: docs,
            description: regulation.description
          });
        }
      }

      logger.info('Shipment requirements checked', {
        origin: request.originCountry,
        destination: request.destinationCountry,
        warningsCount: warnings.length,
        restrictionsCount: restrictions.length
      });

      return {
        warnings,
        restrictions,
        requirements,
        estimatedDuties
      };
    } catch (error) {
      logger.error('Failed to check shipment requirements', { error, request });
      throw error;
    }
  }

  /**
   * Create a new customs regulation
   */
  async createRegulation(data: {
    countryCode: string;
    countryName: string;
    category: string;
    title: string;
    description: string;
    requiredDocuments?: string[];
    restrictedItems?: string[];
    prohibitedItems?: string[];
    dutyRates?: Record<string, string>;
    taxRates?: Record<string, string>;
    officialLink?: string;
  }) {
    const regulationId = `CUST-${data.countryCode}-${uuidv4().substring(0, 8).toUpperCase()}`;

    return prisma.customsRegulation.create({
      data: {
        regulationId,
        countryCode: data.countryCode.toUpperCase(),
        countryName: data.countryName,
        category: data.category as any,
        title: data.title,
        description: data.description,
        requiredDocuments: data.requiredDocuments || [],
        restrictedItems: data.restrictedItems || [],
        prohibitedItems: data.prohibitedItems || [],
        dutyRates: data.dutyRates as any,
        taxRates: data.taxRates as any,
        officialLink: data.officialLink,
        isActive: true
      }
    });
  }

  /**
   * Create a customs warning
   */
  async createWarning(data: {
    countryCode: string;
    warningType: string;
    severity: string;
    title: string;
    message: string;
    productCategories?: string[];
    hsCodes?: string[];
    requiredActions?: string[];
    links?: { title: string; url: string }[];
  }) {
    const warningId = `WARN-${data.countryCode.toUpperCase()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    return prisma.customsWarning.create({
      data: {
        warningId,
        regulationId: '', // Will be linked later
        countryCode: data.countryCode.toUpperCase(),
        warningType: data.warningType as any,
        severity: data.severity as any,
        title: data.title,
        message: data.message,
        productCategories: data.productCategories || [],
        hsCodes: data.hsCodes || [],
        requiredActions: data.requiredActions || [],
        links: data.links as any,
        isActive: true
      }
    });
  }

  /**
   * Get all active countries with customs data
   */
  async getActiveCountries() {
    const countries = await prisma.customsRegulation.findMany({
      where: { isActive: true },
      select: {
        countryCode: true,
        countryName: true,
        _count: {
          select: {
            warnings: true
          }
        }
      },
      distinct: ['countryCode']
    });

    return countries.map(c => ({
      countryCode: c.countryCode,
      countryName: c.countryName,
      warningsCount: c._count.warnings
    }));
  }

  /**
   * Search regulations by keyword
   */
  async searchRegulations(query: string, countryCode?: string) {
    return prisma.customsRegulation.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          },
          countryCode ? { countryCode: countryCode.toUpperCase() } : {}
        ]
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });
  }

  // Private helper methods

  private getCountryName(code: string): string {
    const countries: Record<string, string> = {
      US: 'United States',
      GB: 'United Kingdom',
      DE: 'Germany',
      FR: 'France',
      AE: 'United Arab Emirates',
      SA: 'Saudi Arabia',
      EG: 'Egypt',
      CN: 'China',
      JP: 'Japan',
      IN: 'India',
      AU: 'Australia',
      CA: 'Canada'
    };
    return countries[code.toUpperCase()] || code.toUpperCase();
  }

  private extractGeneralRequirements(regulations: any[]): string[] {
    const requirements = new Set<string>();
    
    for (const reg of regulations) {
      const docs = (reg.requiredDocuments as string[]) || [];
      docs.forEach(d => requirements.add(d));
    }
    
    return Array.from(requirements);
  }
}

export const customsService = new CustomsService();
