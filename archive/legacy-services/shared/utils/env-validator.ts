/**
 * Environment Variable Validator
 * Ensures all required secrets are configured before application starts
 */

export interface EnvConfig {
  required: string[];
  optional?: string[];
  serviceName: string;
}

export class EnvValidator {
  /**
   * Validate required environment variables
   * Throws error if any required variable is missing
   */
  static validate(config: EnvConfig): void {
    const missing: string[] = [];
    const warnings: string[] = [];

    // Check required variables
    for (const key of config.required) {
      if (!process.env[key] || process.env[key]?.trim() === '') {
        missing.push(key);
      }
    }

    // Check optional variables (warnings only)
    if (config.optional) {
      for (const key of config.optional) {
        if (!process.env[key] || process.env[key]?.trim() === '') {
          warnings.push(key);
        }
      }
    }

    // Log warnings
    if (warnings.length > 0) {
      console.warn(`⚠️  [${config.serviceName}] Optional environment variables not set:`);
      warnings.forEach(key => console.warn(`   - ${key}`));
    }

    // Throw error if required variables are missing
    if (missing.length > 0) {
      const errorMsg = [
        `❌ CRITICAL: [${config.serviceName}] Missing required environment variables:`,
        ...missing.map(key => `   - ${key}`),
        '',
        'Application cannot start without these variables.',
        'Please check your .env file or environment configuration.',
      ].join('\n');

      throw new Error(errorMsg);
    }

    console.log(`✅ [${config.serviceName}] Environment validation passed`);
  }

  /**
   * Validate secrets don't contain default/placeholder values
   */
  static validateNoDefaults(variables: Record<string, string[]>): void {
    const defaultPatterns = [
      'your-secret',
      'your_secret',
      'change-me',
      'changeme',
      'secret-key',
      'test-key',
      'example',
      'placeholder',
      'todo',
      'xxx',
    ];

    for (const [key, forbiddenValues] of Object.entries(variables)) {
      const value = process.env[key];
      if (!value) continue;

      const lowerValue = value.toLowerCase();

      // Check against default patterns
      for (const pattern of defaultPatterns) {
        if (lowerValue.includes(pattern)) {
          throw new Error(
            `❌ SECURITY: ${key} contains a default/placeholder value. ` +
            `Please set a secure value in production.`
          );
        }
      }

      // Check against specific forbidden values
      for (const forbidden of forbiddenValues) {
        if (value === forbidden) {
          throw new Error(
            `❌ SECURITY: ${key} is set to a forbidden default value. ` +
            `Please set a secure value in production.`
          );
        }
      }
    }
  }

  /**
   * Validate minimum secret length
   */
  static validateSecretLength(secrets: Record<string, number>): void {
    for (const [key, minLength] of Object.entries(secrets)) {
      const value = process.env[key];
      if (!value) continue;

      if (value.length < minLength) {
        throw new Error(
          `❌ SECURITY: ${key} is too short (${value.length} chars). ` +
          `Minimum length: ${minLength} characters.`
        );
      }
    }
  }
}

/**
 * Common environment configurations for different services
 */
export const ENV_CONFIGS = {
  AUTH_SERVICE: {
    serviceName: 'Auth Service',
    required: ['JWT_SECRET', 'DATABASE_URL'],
    optional: ['REFRESH_TOKEN_SECRET', 'TOKEN_EXPIRY'],
  },

  PAYMENT_SERVICE: {
    serviceName: 'Payment Service',
    required: ['STRIPE_SECRET_KEY', 'DATABASE_URL'],
    optional: ['STRIPE_WEBHOOK_SECRET', 'PAYMOB_API_KEY'],
  },

  COMPLIANCE_SERVICE: {
    serviceName: 'Compliance Service',
    required: ['DATABASE_URL'],
    optional: ['KYC_PROVIDER_API_KEY', 'AML_PROVIDER_API_KEY'],
  },

  CART_SERVICE: {
    serviceName: 'Cart Service',
    required: ['REDIS_URL', 'DATABASE_URL'],
    optional: [],
  },

  CROWDSHIP_SERVICE: {
    serviceName: 'Crowdship Service',
    required: ['DATABASE_URL'],
    optional: ['GOOGLE_MAPS_API_KEY'],
  },
};

/**
 * Production-specific validations
 */
export function validateProductionSecrets(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  console.log('🔒 Running production security checks...');

  // Validate no default values
  EnvValidator.validateNoDefaults({
    JWT_SECRET: ['your-secret-key', 'secret', 'test'],
    STRIPE_SECRET_KEY: ['sk_test_', ''],
    DATABASE_URL: ['localhost', '127.0.0.1'],
  });

  // Validate minimum lengths
  EnvValidator.validateSecretLength({
    JWT_SECRET: 32,
    STRIPE_SECRET_KEY: 20,
  });

  console.log('✅ Production security checks passed');
}
