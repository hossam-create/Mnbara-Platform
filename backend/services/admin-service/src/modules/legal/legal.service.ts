import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { ConsentStatusDto } from './dto/consent-status.dto';

@Injectable()
export class LegalService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getLegalDocuments(language?: string) {
    const whereClause = language ? { language, is_active: true } : { is_active: true };
    
    return this.databaseService.legal_documents.findMany({
      where: whereClause,
      select: {
        id: true,
        slug: true,
        version: true,
        language: true,
        content_hash: true,
        created_at: true
      },
      orderBy: { slug: 'asc' }
    });
  }

  async getLegalDocument(slug: string, language: string = 'en') {
    const document = await this.databaseService.legal_documents.findFirst({
      where: { 
        slug, 
        language,
        is_active: true 
      },
      select: {
        id: true,
        slug: true,
        version: true,
        language: true,
        content_hash: true,
        created_at: true
      }
    });

    if (!document) {
      throw new NotFoundException(`Legal document not found: ${slug} (${language})`);
    }

    return document;
  }

  async createConsent(createConsentDto: CreateConsentDto) {
    const { documentSlug, documentVersion, userId, ipAddress, deviceFingerprint, userAgent, locale } = createConsentDto;

    // Get the document
    const document = await this.databaseService.legal_documents.findFirst({
      where: { 
        slug: documentSlug, 
        version: documentVersion,
        is_active: true 
      }
    });

    if (!document) {
      throw new NotFoundException(`Legal document not found: ${documentSlug} v${documentVersion}`);
    }

    // Create consent record
    const consent = await this.databaseService.user_consents.create({
      data: {
        user_id: userId || null,
        document_id: document.id,
        document_version: documentVersion,
        accepted: true,
        ip_address: ipAddress,
        device_fingerprint: this.hashDeviceFingerprint(deviceFingerprint),
        user_agent: userAgent,
        locale,
        accepted_at: new Date()
      }
    });

    // Create audit log
    await this.databaseService.audit_events.create({
      data: {
        event_type: 'LEGAL_CONSENT',
        actor_id: userId || null,
        metadata: {
          documentSlug,
          documentVersion,
          ipAddress,
          locale
        },
        ip_address: ipAddress
      }
    });

    return consent;
  }

  async getConsentStatus(userId: string | null, documentSlug: string) {
    const latestDocument = await this.databaseService.legal_documents.findFirst({
      where: { 
        slug: documentSlug,
        is_active: true 
      },
      orderBy: { created_at: 'desc' }
    });

    if (!latestDocument) {
      throw new NotFoundException(`Legal document not found: ${documentSlug}`);
    }

    const consent = await this.databaseService.user_consents.findFirst({
      where: {
        user_id: userId || null,
        document_id: latestDocument.id,
        accepted: true
      },
      orderBy: { accepted_at: 'desc' }
    });

    const status: ConsentStatusDto = {
      accepted: !!consent,
      documentVersion: latestDocument.version,
      acceptedAt: consent?.accepted_at,
      requiresReconsent: consent ? consent.document_version !== latestDocument.version : false
    };

    return status;
  }

  async enforceConsentRequirements(userId: string | null, requiredDocuments: string[]) {
    const results: Record<string, ConsentStatusDto> = {};
    
    for (const documentSlug of requiredDocuments) {
      results[documentSlug] = await this.getConsentStatus(userId, documentSlug);
    }

    const missingConsents = Object.entries(results)
      .filter(([_, status]) => !status.accepted || status.requiresReconsent)
      .map(([slug]) => slug);

    return {
      hasAllConsents: missingConsents.length === 0,
      missingConsents,
      details: results
    };
  }

  private hashDeviceFingerprint(fingerprint: string): string {
    // Simple hash for device fingerprint (use crypto in production)
    return Buffer.from(fingerprint).toString('base64').slice(0, 64);
  }
}