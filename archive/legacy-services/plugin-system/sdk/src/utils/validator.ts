/**
 * Plugin Validator
 * 
 * Validation utilities for MNBara plugins
 */

export interface ValidationRule {
  field: string;
  validator: (value: any) => boolean | string;
  message?: string;
  required?: boolean;
}

export interface ValidationSchema {
  [key: string]: ValidationRule | ValidationRule[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  rule?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value?: any;
  rule?: string;
}

export interface PluginValidator {
  validate: (data: any, schema: ValidationSchema) => ValidationResult;
  validateField: (value: any, rule: ValidationRule) => ValidationError | null;
  addRule: (name: string, validator: (...args: any[]) => boolean | string) => void;
  removeRule: (name: string) => void;
  getRules: () => Record<string, (...args: any[]) => boolean | string>;
}

export class DefaultPluginValidator implements PluginValidator {
  private customRules: Record<string, (...args: any[]) => boolean | string> = {};

  constructor() {
    this.initializeDefaultRules();
  }

  validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const fieldRules = Array.isArray(rules) ? rules : [rules];
      const value = this.getNestedValue(data, field);

      for (const rule of fieldRules) {
        const error = this.validateField(value, rule);
        if (error) {
          if (rule.required) {
            errors.push(error);
          } else {
            warnings.push({
              field,
              message: error.message,
              value,
              rule: rule.validator.name
            });
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateField(value: any, rule: ValidationRule): ValidationError | null {
    if (rule.required && (value === undefined || value === null || value === '')) {
      return {
        field: rule.field,
        message: rule.message || `${rule.field} is required`,
        value,
        rule: 'required'
      };
    }

    if (value !== undefined && value !== null && value !== '') {
      try {
        const result = rule.validator(value);
        if (result !== true) {
          return {
            field: rule.field,
            message: typeof result === 'string' ? result : (rule.message || `${rule.field} is invalid`),
            value,
            rule: rule.validator.name
          };
        }
      } catch (error) {
        return {
          field: rule.field,
          message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
          value,
          rule: rule.validator.name
        };
      }
    }

    return null;
  }

  addRule(name: string, validator: (...args: any[]) => boolean | string): void {
    this.customRules[name] = validator;
  }

  removeRule(name: string): void {
    delete this.customRules[name];
  }

  getRules(): Record<string, (...args: any[]) => boolean | string> {
    return { ...this.customRules };
  }

  private initializeDefaultRules(): void {
    // String validation
    this.addRule('string', (value) => typeof value === 'string');
    this.addRule('minLength', (value, minLength: number) => 
      typeof value === 'string' && value.length >= minLength);
    this.addRule('maxLength', (value, maxLength: number) => 
      typeof value === 'string' && value.length <= maxLength);
    this.addRule('pattern', (value, pattern: RegExp) => 
      typeof value === 'string' && pattern.test(value));

    // Number validation
    this.addRule('number', (value) => typeof value === 'number' && !isNaN(value));
    this.addRule('integer', (value) => Number.isInteger(value));
    this.addRule('positive', (value) => typeof value === 'number' && value > 0);
    this.addRule('min', (value, min: number) => typeof value === 'number' && value >= min);
    this.addRule('max', (value, max: number) => typeof value === 'number' && value <= max);

    // Array validation
    this.addRule('array', (value) => Array.isArray(value));
    this.addRule('minItems', (value, minItems: number) => 
      Array.isArray(value) && value.length >= minItems);
    this.addRule('maxItems', (value, maxItems: number) => 
      Array.isArray(value) && value.length <= maxItems);

    // Object validation
    this.addRule('object', (value) => typeof value === 'object' && value !== null && !Array.isArray(value));

    // Boolean validation
    this.addRule('boolean', (value) => typeof value === 'boolean');

    // Email validation
    this.addRule('email', (value) => {
      if (typeof value !== 'string') return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    });

    // URL validation
    this.addRule('url', (value) => {
      if (typeof value !== 'string') return false;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    });

    // UUID validation
    this.addRule('uuid', (value) => {
      if (typeof value !== 'string') return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value);
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}