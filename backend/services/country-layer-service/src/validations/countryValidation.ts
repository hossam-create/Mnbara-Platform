import { body, param } from 'express-validator';

export const countryValidation = {
  // Country validation
  createCountry: [
    body('code')
      .isLength({ min: 2, max: 3 })
      .isAlpha()
      .toUpperCase()
      .withMessage('Country code must be 2-3 alphabetic characters'),
    body('name')
      .isLength({ min: 2, max: 100 })
      .withMessage('Country name must be between 2 and 100 characters'),
    body('nameAr')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Arabic country name must be between 2 and 100 characters'),
    body('currency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .isAlpha()
      .toUpperCase()
      .withMessage('Currency must be 3 alphabetic characters'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],

  updateCountry: [
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Country name must be between 2 and 100 characters'),
    body('nameAr')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Arabic country name must be between 2 and 100 characters'),
    body('currency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .isAlpha()
      .toUpperCase()
      .withMessage('Currency must be 3 alphabetic characters'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],

  // Product country validation
  addProductCountry: [
    body('countryCode')
      .isLength({ min: 2, max: 3 })
      .isAlpha()
      .toUpperCase()
      .withMessage('Country code must be 2-3 alphabetic characters'),
    body('countryType')
      .isIn(['origin', 'purchase', 'delivery'])
      .withMessage('Country type must be one of: origin, purchase, delivery'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],

  updateProductCountry: [
    body('countryType')
      .optional()
      .isIn(['origin', 'purchase', 'delivery'])
      .withMessage('Country type must be one of: origin, purchase, delivery'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],

  // Rule validation
  createRule: [
    body('countryCode')
      .isLength({ min: 2, max: 3 })
      .isAlpha()
      .toUpperCase()
      .withMessage('Country code must be 2-3 alphabetic characters'),
    body('ruleType')
      .isIn(['import', 'export', 'customs', 'restricted', 'prohibited'])
      .withMessage('Rule type must be one of: import, export, customs, restricted, prohibited'),
    body('productType')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Product type must be between 1 and 50 characters'),
    body('description')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    body('descriptionAr')
      .optional()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Arabic description must be between 10 and 1000 characters'),
    body('severity')
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Severity must be one of: low, medium, high, critical'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],

  updateRule: [
    body('ruleType')
      .optional()
      .isIn(['import', 'export', 'customs', 'restricted', 'prohibited'])
      .withMessage('Rule type must be one of: import, export, customs, restricted, prohibited'),
    body('productType')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Product type must be between 1 and 50 characters'),
    body('description')
      .optional()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    body('descriptionAr')
      .optional()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Arabic description must be between 10 and 1000 characters'),
    body('severity')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Severity must be one of: low, medium, high, critical'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],

  // Route validation
  validateRoute: [
    body('originCountry')
      .isLength({ min: 2, max: 3 })
      .isAlpha()
      .toUpperCase()
      .withMessage('Origin country must be 2-3 alphabetic characters'),
    body('destinationCountry')
      .isLength({ min: 2, max: 3 })
      .isAlpha()
      .toUpperCase()
      .withMessage('Destination country must be 2-3 alphabetic characters'),
    body('productType')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Product type must be between 1 and 50 characters')
  ],

  validateProductRoute: [
    body('productId')
      .isUUID()
      .withMessage('Product ID must be a valid UUID'),
    body('destinationCountry')
      .isLength({ min: 2, max: 3 })
      .isAlpha()
      .toUpperCase()
      .withMessage('Destination country must be 2-3 alphabetic characters')
  ],

  // Traveler route validation
  addTravelerRoute: [
    body('originCountry')
      .isLength({ min: 2, max: 3 })
      .isAlpha()
      .toUpperCase()
      .withMessage('Origin country must be 2-3 alphabetic characters'),
    body('destinationCountry')
      .isLength({ min: 2, max: 3 })
      .isAlpha()
      .toUpperCase()
      .withMessage('Destination country must be 2-3 alphabetic characters'),
    body('travelDate')
      .isISO8601()
      .withMessage('Travel date must be a valid ISO 8601 date'),
    body('returnDate')
      .optional()
      .isISO8601()
      .withMessage('Return date must be a valid ISO 8601 date'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ]
};