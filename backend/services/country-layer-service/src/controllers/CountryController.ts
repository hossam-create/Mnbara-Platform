import { Request, Response } from 'express';
import { CountryService } from '../services/CountryService';
import { ProductCountryService } from '../services/ProductCountryService';
import { ComplianceService } from '../services/ComplianceService';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export class CountryController {
  private countryService: CountryService;
  private productCountryService: ProductCountryService;
  private complianceService: ComplianceService;

  constructor() {
    this.countryService = new CountryService();
    this.productCountryService = new ProductCountryService();
    this.complianceService = new ComplianceService();
  }

  // Country management
  getAllCountries = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, active } = req.query;
      const countries = await this.countryService.getAllCountries({
        page: Number(page),
        limit: Number(limit),
        active: active === 'true'
      });
      
      res.json({
        success: true,
        data: countries,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: countries.length
        }
      });
    } catch (error) {
      logger.error('Error getting countries:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch countries'
      });
    }
  };

  getCountryByCode = async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const country = await this.countryService.getCountryByCode(code);
      
      if (!country) {
        return res.status(404).json({
          success: false,
          error: 'Country not found'
        });
      }
      
      res.json({
        success: true,
        data: country
      });
    } catch (error) {
      logger.error('Error getting country by code:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch country'
      });
    }
  };

  createCountry = async (req: Request, res: Response) => {
    try {
      const country = await this.countryService.createCountry(req.body);
      
      res.status(201).json({
        success: true,
        data: country,
        message: 'Country created successfully'
      });
    } catch (error) {
      logger.error('Error creating country:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create country'
      });
    }
  };

  updateCountry = async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const country = await this.countryService.updateCountry(code, req.body);
      
      if (!country) {
        return res.status(404).json({
          success: false,
          error: 'Country not found'
        });
      }
      
      res.json({
        success: true,
        data: country,
        message: 'Country updated successfully'
      });
    } catch (error) {
      logger.error('Error updating country:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update country'
      });
    }
  };

  deleteCountry = async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const deleted = await this.countryService.deleteCountry(code);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Country not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Country deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting country:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete country'
      });
    }
  };

  // Product country routes
  getProductCountries = async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const countries = await this.productCountryService.getProductCountries(productId);
      
      res.json({
        success: true,
        data: countries
      });
    } catch (error) {
      logger.error('Error getting product countries:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch product countries'
      });
    }
  };

  addProductCountry = async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const country = await this.productCountryService.addCountryDataToProduct(productId, req.body);
      
      res.status(201).json({
        success: true,
        data: country,
        message: 'Product country added successfully'
      });
    } catch (error) {
      logger.error('Error adding product country:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add product country'
      });
    }
  };

  updateProductCountry = async (req: Request, res: Response) => {
    try {
      const { productId, countryCode } = req.params;
      const country = await this.productCountryService.updateProductCountry(productId, countryCode, req.body);
      
      if (!country) {
        return res.status(404).json({
          success: false,
          error: 'Product country not found'
        });
      }
      
      res.json({
        success: true,
        data: country,
        message: 'Product country updated successfully'
      });
    } catch (error) {
      logger.error('Error updating product country:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update product country'
      });
    }
  };

  removeProductCountry = async (req: Request, res: Response) => {
    try {
      const { productId, countryCode } = req.params;
      const deleted = await this.productCountryService.removeProductCountry(productId, countryCode);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Product country not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Product country removed successfully'
      });
    } catch (error) {
      logger.error('Error removing product country:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove product country'
      });
    }
  };

  // Country rules
  getAllRules = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, countryCode } = req.query;
      const rules = await this.complianceService.getAllRules({
        page: Number(page),
        limit: Number(limit),
        countryCode: countryCode as string
      });
      
      res.json({
        success: true,
        data: rules,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: rules.length
        }
      });
    } catch (error) {
      logger.error('Error getting rules:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch rules'
      });
    }
  };

  getRuleById = async (req: Request, res: Response) => {
    try {
      const { ruleId } = req.params;
      const rule = await this.complianceService.getRuleById(ruleId);
      
      if (!rule) {
        return res.status(404).json({
          success: false,
          error: 'Rule not found'
        });
      }
      
      res.json({
        success: true,
        data: rule
      });
    } catch (error) {
      logger.error('Error getting rule by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch rule'
      });
    }
  };

  createRule = async (req: Request, res: Response) => {
    try {
      const rule = await this.complianceService.createRule(req.body);
      
      res.status(201).json({
        success: true,
        data: rule,
        message: 'Rule created successfully'
      });
    } catch (error) {
      logger.error('Error creating rule:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create rule'
      });
    }
  };

  updateRule = async (req: Request, res: Response) => {
    try {
      const { ruleId } = req.params;
      const rule = await this.complianceService.updateRule(ruleId, req.body);
      
      if (!rule) {
        return res.status(404).json({
          success: false,
          error: 'Rule not found'
        });
      }
      
      res.json({
        success: true,
        data: rule,
        message: 'Rule updated successfully'
      });
    } catch (error) {
      logger.error('Error updating rule:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update rule'
      });
    }
  };

  deleteRule = async (req: Request, res: Response) => {
    try {
      const { ruleId } = req.params;
      const deleted = await this.complianceService.deleteRule(ruleId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Rule not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Rule deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting rule:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete rule'
      });
    }
  };

  // Compliance validation
  validateRoute = async (req: Request, res: Response) => {
    try {
      const { originCountry, destinationCountry, productType } = req.body;
      const validation = await this.complianceService.validateRoute({
        originCountry,
        destinationCountry,
        productType
      });
      
      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      logger.error('Error validating route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate route'
      });
    }
  };

  validateProductRoute = async (req: Request, res: Response) => {
    try {
      const { productId, destinationCountry } = req.body;
      const validation = await this.complianceService.validateProductRoute(productId, destinationCountry);
      
      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      logger.error('Error validating product route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate product route'
      });
    }
  };

  // Traveler routes
  getTravelerRoutes = async (req: Request, res: Response) => {
    try {
      const { travelerId } = req.params;
      const routes = await this.countryService.getTravelerRoutes(travelerId);
      
      res.json({
        success: true,
        data: routes
      });
    } catch (error) {
      logger.error('Error getting traveler routes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch traveler routes'
      });
    }
  };

  addTravelerRoute = async (req: Request, res: Response) => {
    try {
      const { travelerId } = req.params;
      const route = await this.countryService.addTravelerRoute(travelerId, req.body);
      
      res.status(201).json({
        success: true,
        data: route,
        message: 'Traveler route added successfully'
      });
    } catch (error) {
      logger.error('Error adding traveler route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add traveler route'
      });
    }
  };

  removeTravelerRoute = async (req: Request, res: Response) => {
    try {
      const { travelerId, routeId } = req.params;
      const deleted = await this.countryService.removeTravelerRoute(travelerId, routeId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Traveler route not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Traveler route removed successfully'
      });
    } catch (error) {
      logger.error('Error removing traveler route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove traveler route'
      });
    }
  };

  // Compliance logs
  getComplianceLogs = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, productId, countryCode } = req.query;
      const logs = await this.complianceService.getComplianceLogs({
        page: Number(page),
        limit: Number(limit),
        productId: productId as string,
        countryCode: countryCode as string
      });
      
      res.json({
        success: true,
        data: logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: logs.length
        }
      });
    } catch (error) {
      logger.error('Error getting compliance logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch compliance logs'
      });
    }
  };

  getComplianceLogById = async (req: Request, res: Response) => {
    try {
      const { logId } = req.params;
      const log = await this.complianceService.getComplianceLogById(logId);
      
      if (!log) {
        return res.status(404).json({
          success: false,
          error: 'Compliance log not found'
        });
      }
      
      res.json({
        success: true,
        data: log
      });
    } catch (error) {
      logger.error('Error getting compliance log by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch compliance log'
      });
    }
  };
}