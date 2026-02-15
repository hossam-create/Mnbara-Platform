import { Router } from 'express';
import { CountryController } from '../controllers/CountryController';
import { authMiddleware } from '../middleware/authMiddleware';
import { rateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import { countryValidation } from '../validations/countryValidation';

const router = Router();
const countryController = new CountryController();

// Public routes
router.get('/countries', rateLimiter, countryController.getAllCountries);
router.get('/countries/:code', rateLimiter, countryController.getCountryByCode);

// Protected routes
router.use(authMiddleware);

// Country management
router.post('/countries', 
  rateLimiter, 
  validateRequest(countryValidation.createCountry),
  countryController.createCountry
);

router.put('/countries/:code', 
  rateLimiter, 
  validateRequest(countryValidation.updateCountry),
  countryController.updateCountry
);

router.delete('/countries/:code', rateLimiter, countryController.deleteCountry);

// Product country routes
router.get('/products/:productId/countries', rateLimiter, countryController.getProductCountries);
router.post('/products/:productId/countries', 
  rateLimiter, 
  validateRequest(countryValidation.addProductCountry),
  countryController.addProductCountry
);

router.put('/products/:productId/countries/:countryCode', 
  rateLimiter, 
  validateRequest(countryValidation.updateProductCountry),
  countryController.updateProductCountry
);

router.delete('/products/:productId/countries/:countryCode', rateLimiter, countryController.removeProductCountry);

// Country rules
router.get('/rules', rateLimiter, countryController.getAllRules);
router.get('/rules/:ruleId', rateLimiter, countryController.getRuleById);
router.post('/rules', 
  rateLimiter, 
  validateRequest(countryValidation.createRule),
  countryController.createRule
);

router.put('/rules/:ruleId', 
  rateLimiter, 
  validateRequest(countryValidation.updateRule),
  countryController.updateRule
);

router.delete('/rules/:ruleId', rateLimiter, countryController.deleteRule);

// Compliance validation
router.post('/validate-route', 
  rateLimiter, 
  validateRequest(countryValidation.validateRoute),
  countryController.validateRoute
);

router.post('/validate-product-route', 
  rateLimiter, 
  validateRequest(countryValidation.validateProductRoute),
  countryController.validateProductRoute
);

// Traveler routes
router.get('/travelers/:travelerId/routes', rateLimiter, countryController.getTravelerRoutes);
router.post('/travelers/:travelerId/routes', 
  rateLimiter, 
  validateRequest(countryValidation.addTravelerRoute),
  countryController.addTravelerRoute
);

router.delete('/travelers/:travelerId/routes/:routeId', rateLimiter, countryController.removeTravelerRoute);

// Compliance logs
router.get('/compliance-logs', rateLimiter, countryController.getComplianceLogs);
router.get('/compliance-logs/:logId', rateLimiter, countryController.getComplianceLogById);

export default router;