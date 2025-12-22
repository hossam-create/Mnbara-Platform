import { Controller, Get, Post, Query, Body, Headers, Req, Param } from '@nestjs/common';
import { Request } from 'express';
import { LegalService } from './legal.service';
import { CreateConsentDto } from './dto/create-consent.dto';

@Controller('legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get('documents')
  async getLegalDocuments(@Query('lang') language?: string) {
    return this.legalService.getLegalDocuments(language);
  }

  @Get('documents/:slug')
  async getLegalDocument(
    @Param('slug') slug: string,
    @Query('lang') language: string = 'en'
  ) {
    return this.legalService.getLegalDocument(slug, language);
  }

  @Post('consent')
  async createConsent(
    @Body() createConsentDto: CreateConsentDto,
    @Headers('user-agent') userAgent: string,
    @Req() request: Request
  ) {
    // Get client IP from headers (behind proxy) with proper validation
    let ipAddress = '';
    
    // Check x-forwarded-for header first (for proxies)
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      ipAddress = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      // Remove port if present
      ipAddress = ipAddress.split(':')[0];
    } else {
      // Fallback to direct connection
      ipAddress = request.socket.remoteAddress || '';
      // Remove IPv6 prefix if present
      if (ipAddress.startsWith('::ffff:')) {
        ipAddress = ipAddress.substring(7);
      }
    }
    
    // Validate IP address format
    if (!this.isValidIP(ipAddress)) {
      ipAddress = 'unknown';
    }
    
    const consentData = {
      ...createConsentDto,
      userAgent: userAgent || '',
      ipAddress
    };

    return this.legalService.createConsent(consentData);
  }

  private isValidIP(ip: string): boolean {
    // Simple IP validation
    if (ip === 'unknown' || ip === '') return false;
    
    // IPv4 pattern
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 pattern (simplified)
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
  }

  @Get('consent/status')
  async getConsentStatus(
    @Query('userId') userId: string,
    @Query('slug') slug: string
  ) {
    return this.legalService.getConsentStatus(userId || null, slug);
  }

  @Post('consent/enforce')
  async enforceConsentRequirements(
    @Body() body: { userId?: string; requiredDocuments: string[] }
  ) {
    return this.legalService.enforceConsentRequirements(
      body.userId || null,
      body.requiredDocuments
    );
  }
}