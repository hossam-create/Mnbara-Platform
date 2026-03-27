/**
 * Validation Service
 * Email, Phone, Address validation and KYC/AML checks
 */

import { BaseApiClient } from './base-client';
import { config } from './config';
import { 
  ApiResponse, 
  EmailValidationResult, 
  PhoneValidationResult, 
  AddressValidationResult 
} from './types';

export class EmailValidationService extends BaseApiClient {
  constructor() {
    const validationConfig = config.getServiceConfig('emailValidation');
    
    if (!validationConfig) {
      throw new Error('Email validation service not configured');
    }

    super('email-validation', validationConfig);
  }

  async validateEmail(email: string): Promise<ApiResponse<EmailValidationResult>> {
    const cacheKey = `email:${email}`;
    
    const response = await this.get<any>(
      '/verify',
      { email, api_key: this.config.apiKey },
      cacheKey
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: {
          email,
          valid: response.data.valid,
          disposable: response.data.disposable || false,
          role: response.data.role || false,
          reason: response.data.reason,
        },
        cached: response.cached,
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<EmailValidationResult>;
  }

  async validateBulkEmails(emails: string[]): Promise<ApiResponse<EmailValidationResult[]>> {
    const results = await Promise.all(
      emails.map(email => this.validateEmail(email))
    );

    return {
      success: true,
      data: results.map(r => r.data!).filter(Boolean),
      timestamp: new Date(),
    };
  }
}

export class PhoneValidationService extends BaseApiClient {
  constructor() {
    const validationConfig = config.getServiceConfig('phoneValidation');
    
    if (!validationConfig) {
      throw new Error('Phone validation service not configured');
    }

    super('phone-validation', validationConfig);
  }

  async validatePhone(phone: string, countryCode?: string): Promise<ApiResponse<PhoneValidationResult>> {
    const cacheKey = `phone:${phone}`;
    
    const params: any = {
      number: phone,
      access_key: this.config.apiKey,
    };

    if (countryCode) {
      params.country_code = countryCode;
    }

    const response = await this.get<any>('/validate', params, cacheKey);

    if (response.success && response.data) {
      return {
        success: true,
        data: {
          phone,
          valid: response.data.valid,
          country: response.data.country_code,
          carrier: response.data.carrier,
          type: response.data.line_type,
        },
        cached: response.cached,
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<PhoneValidationResult>;
  }
}

export class AddressValidationService extends BaseApiClient {
  constructor() {
    const validationConfig = config.getServiceConfig('addressValidation');
    
    if (!validationConfig) {
      throw new Error('Address validation service not configured');
    }

    super('address-validation', validationConfig);
  }

  async validateAddress(address: string): Promise<ApiResponse<AddressValidationResult>> {
    const response = await this.post<any>('/verify', {
      address,
      api_key: this.config.apiKey,
    });

    if (response.success && response.data) {
      return {
        success: true,
        data: {
          address,
          valid: response.data.valid,
          normalized: response.data.normalized_address,
          components: {
            street: response.data.street,
            city: response.data.city,
            state: response.data.state,
            postalCode: response.data.postal_code,
            country: response.data.country,
          },
        },
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<AddressValidationResult>;
  }
}
