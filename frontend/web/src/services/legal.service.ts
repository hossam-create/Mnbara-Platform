// ============================================
// 🌍 Mnbara Platform - Legal Service
// Requirements: Legal consent recording, audit logging, backend integration
// ============================================

import { api } from './api';
import { getDeviceFingerprint } from '../utils/deviceFingerprint';

export interface LegalDocument {
  id: string;
  slug: string;
  version: string;
  language: string;
  content_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsentStatus {
  hasConsent: boolean;
  documentSlug: string;
  documentVersion: string;
  acceptedAt?: string;
  requiresReconsent: boolean;
}

export interface CreateConsentRequest {
  userId?: string;
  documentSlug: string;
  documentVersion: string;
  ipAddress: string;
  deviceFingerprint: string;
  userAgent: string;
  locale: string;
}

export interface ConsentResponse {
  id: string;
  userId?: string;
  documentId: string;
  documentVersion: string;
  accepted: boolean;
  acceptedAt: string;
}

class LegalService {
  private basePath = '/api/legal';

  async getLegalDocuments(language?: string): Promise<LegalDocument[]> {
    try {
      const params = language ? { lang: language } : {};
      const response = await api.get(`${this.basePath}/documents`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch legal documents:', error);
      throw error;
    }
  }

  async getLegalDocument(slug: string, language?: string): Promise<LegalDocument> {
    try {
      const params = language ? { lang: language } : {};
      const response = await api.get(`${this.basePath}/documents/${slug}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch legal document ${slug}:`, error);
      throw error;
    }
  }

  async createConsent(createConsentDto: CreateConsentRequest): Promise<ConsentResponse> {
    try {
      const response = await api.post(`${this.basePath}/consent`, createConsentDto);
      return response.data;
    } catch (error) {
      console.error('Failed to create consent:', error);
      throw error;
    }
  }

  async getConsentStatus(userId?: string, documentSlug?: string): Promise<ConsentStatus[]> {
    try {
      const params: any = {};
      if (userId) params.userId = userId;
      if (documentSlug) params.slug = documentSlug;
      
      const response = await api.get(`${this.basePath}/consent/status`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch consent status:', error);
      throw error;
    }
  }

  async logAuditEvent(eventType: string, metadata?: any): Promise<void> {
    try {
      await api.post('/api/audit/event', {
        event_type: eventType,
        metadata,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        locale: navigator.language
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw for audit events to avoid blocking user experience
    }
  }

  async createConsentWithDeviceInfo(
    documentSlug: string,
    documentVersion: string,
    userId?: string
  ): Promise<ConsentResponse> {
    const deviceFingerprint = await getDeviceFingerprint();
    const ipAddress = await this.getClientIP();

    return this.createConsent({
      userId,
      documentSlug,
      documentVersion,
      ipAddress,
      deviceFingerprint,
      userAgent: navigator.userAgent,
      locale: navigator.language
    });
  }

  private async getClientIP(): Promise<string> {
    try {
      // This will be captured server-side, but we try to get client IP if possible
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('Could not determine client IP:', error);
      return 'unknown';
    }
  }

  // Helper method for footer link clicks
  async trackFooterClick(linkName: string, section: string): Promise<void> {
    await this.logAuditEvent('PAGE_VIEW', {
      page: linkName,
      section: section,
      referrer: document.referrer
    });
  }

  // Helper method for language changes
  async trackLanguageChange(oldLanguage: string, newLanguage: string): Promise<void> {
    await this.logAuditEvent('LOCALE_CHANGE', {
      old_language: oldLanguage,
      new_language: newLanguage
    });
  }
}

export const legalService = new LegalService();