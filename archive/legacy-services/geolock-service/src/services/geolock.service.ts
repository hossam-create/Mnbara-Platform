// GeoLock Service - Core Access Control
// خدمة GeoLock - التحكم الأساسي في الوصول

import { PrismaClient, GeoLock as GeoLockModel } from '@prisma/client';
import { 
  GeoLockCheckRequest, 
  GeoLockCheckResult, 
  GeoLockRule,
  IPLocation,
  GPSLocation
} from '../types';
import { ipDetectionService } from './ip-detection.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class GeoLockService {
  /**
   * Check if access is allowed based on GeoLock rules
   */
  async checkAccess(request: GeoLockCheckRequest): Promise<GeoLockCheckResult> {
    try {
      // Get IP location
      const ipLocation = request.ipAddress 
        ? await ipDetectionService.detectFromIP(request.ipAddress)
        : null;

      // Detect network type (VPN, Proxy, etc.)
      const networkType = ipLocation 
        ? await ipDetectionService.detectNetworkType(request.ipAddress!, ipLocation)
        : { isVPN: false, isProxy: false, isTor: false, isDataCenter: false };

      // Get active GeoLock rules
      const rules = await this.getActiveRules();
      
      // Check each rule
      for (const rule of rules) {
        const ruleMatch = this.evaluateRule(rule, request, ipLocation, networkType);
        
        if (ruleMatch.blocked) {
          return this.createBlockedResult(rule, ipLocation, networkType, request);
        }
      }

      // Check for bypasses
      const bypassInfo = await this.checkBypassAvailability(request);

      return {
        allowed: true,
        riskScore: this.calculateRiskScore(ipLocation, networkType),
        bypassAvailable: bypassInfo.available,
        bypassExpiresAt: bypassInfo.expiresAt,
        detectedLocation: ipLocation || undefined
      };
    } catch (error) {
      logger.error('GeoLock check error:', error);
      // Fail open for safety, but log the error
      return {
        allowed: true,
        riskScore: 50,
        bypassAvailable: false,
        reason: 'Error during location check - access granted by default',
        reasonAr: 'حدث خطأ أثناء التحقق من الموقع - تم منح الوصول افتراضيًا'
      };
    }
  }

  /**
   * Evaluate a single GeoLock rule
   */
  private evaluateRule(
    rule: GeoLockModel,
    request: GeoLockCheckRequest,
    ipLocation: IPLocation | null,
    networkType: any
  ): { blocked: boolean; reason?: string } {
    // Check if rule applies to this target
    if (rule.targetType !== 'ALL') {
      if (rule.targetType === 'USER' && !rule.targetIds.includes(request.targetId)) {
        return { blocked: false };
      }
      if (rule.targetType === 'ROLE' && request.userRoles) {
        const hasRole = request.userRoles.some(role => rule.targetIds.includes(role));
        if (!hasRole) return { blocked: false };
      }
    }

    // Check IP-based rules first (fastest check)
    if (rule.allowedIPs.length > 0 || rule.blockedIPs.length > 0) {
      if (request.ipAddress) {
        if (rule.allowedIPs.length > 0) {
          const isAllowed = this.isIPInRanges(request.ipAddress, rule.allowedIPs);
          if (!isAllowed && rule.ipWhitelistMode) {
            return { blocked: true, reason: 'IP not in whitelist' };
          }
        }
        if (rule.blockedIPs.length > 0) {
          const isBlocked = this.isIPInRanges(request.ipAddress, rule.blockedIPs);
          if (isBlocked) {
            return { blocked: true, reason: 'IP is blocked' };
          }
        }
      }
    }

    // Check country restrictions
    if (ipLocation?.countryCode) {
      if (rule.countries.length > 0) {
        const inCountries = rule.countries.includes(ipLocation.countryCode);
        
        if (rule.lockType === 'WHITELIST' && !inCountries) {
          return { blocked: true, reason: 'Country not in whitelist' };
        }
        if (rule.lockType === 'BLACKLIST' && inCountries) {
          return { blocked: true, reason: 'Country is blocked' };
        }
      }

      // Check regions
      if (rule.regions.length > 0 && ipLocation.regionCode) {
        const inRegions = rule.regions.includes(ipLocation.regionCode);
        if (rule.lockType === 'WHITELIST' && !inRegions) {
          return { blocked: true, reason: 'Region not in whitelist' };
        }
        if (rule.lockType === 'BLACKLIST' && inRegions) {
          return { blocked: true, reason: 'Region is blocked' };
        }
      }

      // Check cities
      if (rule.cities.length > 0 && ipLocation.city) {
        const inCities = rule.cities.includes(ipLocation.city);
        if (rule.lockType === 'WHITELIST' && !inCities) {
          return { blocked: true, reason: 'City not in whitelist' };
        }
        if (rule.lockType === 'BLACKLIST' && inCities) {
          return { blocked: true, reason: 'City is blocked' };
        }
      }
    }

    // Check network type restrictions
    if (rule.blockVPNs && networkType.isVPN) {
      return { blocked: true, reason: 'VPN connections are blocked' };
    }
    if (rule.blockProxies && networkType.isProxy) {
      return { blocked: true, reason: 'Proxy connections are blocked' };
    }
    if (rule.blockTor && networkType.isTor) {
      return { blocked: true, reason: 'Tor connections are blocked' };
    }
    if (rule.blockDataCenters && networkType.isDataCenter) {
      return { blocked: true, reason: 'Data center IPs are blocked' };
    }

    // Check time restrictions
    if (rule.timeRestrictions || rule.dayRestrictions.length > 0) {
      const now = new Date();
      const timeRestriction = rule.timeRestrictions as { start?: string; end?: string; timezone?: string } | null;
      
      if (rule.dayRestrictions.length > 0) {
        const currentDay = now.getDay();
        if (!rule.dayRestrictions.includes(currentDay)) {
          return { blocked: true, reason: 'Access not allowed on this day' };
        }
      }

      if (timeRestriction?.start && timeRestriction?.end) {
        const currentTime = now.toTimeString().slice(0, 5);
        if (currentTime < timeRestriction.start || currentTime > timeRestriction.end) {
          return { blocked: true, reason: 'Outside allowed time window' };
        }
      }
    }

    return { blocked: false };
  }

  /**
   * Get active GeoLock rules
   */
  private async getActiveRules(): Promise<GeoLockModel[]> {
    try {
      return await prisma.geoLockConfig.findMany({
        where: {
          isActive: true
        },
        orderBy: {
          priority: 'desc'
        }
      });
    } catch (error) {
      logger.error('Error fetching GeoLock rules:', error);
      return [];
    }
  }

  /**
   * Check if IP is in any of the specified ranges
   */
  private isIPInRanges(ip: string, ranges: string[]): boolean {
    for (const range of ranges) {
      if (this.ipMatchesRange(ip, range)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if IP matches a CIDR range or exact IP
   */
  private ipMatchesRange(ip: string, range: string): boolean {
    // Exact match
    if (ip === range) return true;

    // CIDR notation
    if (range.includes('/')) {
      try {
        const [subnet, mask] = range.split('/');
        const ipParts = ip.split('.').map(Number);
        const subnetParts = subnet.split('.').map(Number);
        
        if (ipParts.length !== 4 || subnetParts.length !== 4) return false;
        
        const maskNum = parseInt(mask);
        const ipNum = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
        const subnetNum = (subnetParts[0] << 24) + (subnetParts[1] << 16) + (subnetParts[2] << 8) + subnetParts[3];
        const maskFull = ~((1 << (32 - maskNum)) - 1);
        
        return (ipNum & maskFull) === (subnetNum & maskFull);
      } catch (e) {
        return false;
      }
    }

    return false;
  }

  /**
   * Create blocked result
   */
  private createBlockedResult(
    rule: GeoLockModel,
    ipLocation: IPLocation | null,
    networkType: any,
    request: GeoLockCheckRequest
  ): GeoLockCheckResult {
    // Check if bypass is available
    const bypassAvailable = this.checkRuleBypass(rule, request);

    return {
      allowed: false,
      lockId: rule.id,
      lockName: rule.name,
      reason: this.getBlockReason(rule, ipLocation),
      reasonAr: this.getBlockReasonAr(rule, ipLocation),
      blockAction: rule.blockAction,
      redirectUrl: rule.redirectURL || undefined,
      message: rule.message || undefined,
      messageAr: rule.messageAr || undefined,
      riskScore: this.calculateRiskScore(ipLocation, networkType),
      bypassAvailable,
      detectedLocation: ipLocation || undefined
    };
  }

  /**
   * Get block reason in English
   */
  private getBlockReason(rule: GeoLockModel, ipLocation: IPLocation | null): string {
    if (rule.lockType === 'WHITELIST') {
      return `Access restricted. ${ipLocation?.country || 'Your location'} is not in the allowed list.`;
    }
    if (rule.lockType === 'BLACKLIST') {
      return `Access denied from ${ipLocation?.country || 'your location'}.`;
    }
    return 'Access denied based on geographic restrictions.';
  }

  /**
   * Get block reason in Arabic
   */
  private getBlockReasonAr(rule: GeoLockModel, ipLocation: IPLocation | null): string {
    const location = ipLocation?.country || 'موقعك';
    if (rule.lockType === 'WHITELIST') {
      return `تم تقييد الوصول. ${location} غير موجود في القائمة المسموحة.`;
    }
    if (rule.lockType === 'BLACKLIST') {
      return `تم رفض الوصول من ${location}.`;
    }
    return 'تم رفض الوصول بناءً على القيود الجغرافية.';
  }

  /**
   * Check if bypass is available for this request
   */
  private checkBypassAvailability(request: GeoLockCheckRequest): {
    available: boolean;
    expiresAt?: Date;
  } {
    // Check if IP is in bypass list
    if (request.ipAddress) {
      // This would check Redis or database for active bypasses
      // For now, return false (no bypass)
    }
    return { available: false };
  }

  /**
   * Check if a specific rule can be bypassed
   */
  private checkRuleBypass(rule: GeoLockModel, request: GeoLockCheckRequest): boolean {
    // Check if requester IP is in bypass list
    if (request.ipAddress && rule.allowBypassWithIP.includes(request.ipAddress)) {
      return true;
    }
    
    // Check if user role allows bypass
    if (request.userRoles && rule.bypassRoles.length > 0) {
      const hasBypassRole = request.userRoles.some(role => rule.bypassRoles.includes(role));
      if (hasBypassRole) return true;
    }
    
    return false;
  }

  /**
   * Calculate risk score based on location and network type
   */
  private calculateRiskScore(ipLocation: IPLocation | null, networkType: any): number {
    let score = 0;
    
    if (networkType.isVPN) score += 30;
    if (networkType.isProxy) score += 40;
    if (networkType.isTor) score += 70;
    if (networkType.isDataCenter) score += 20;
    if (networkType.isHosting) score += 10;
    
    if (!ipLocation) score += 20; // Unknown location
    
    return Math.min(score, 100);
  }

  /**
   * Create a new GeoLock rule
   */
  async createRule(data: Partial<GeoLockModel>): Promise<GeoLockModel> {
    return await prisma.geoLockConfig.create({
      data: {
        name: data.name || 'New Rule',
        description: data.description,
        lockType: data.lockType || 'BLACKLIST',
        targetType: data.targetType || 'ALL',
        targetIds: data.targetIds || [],
        countries: data.countries || [],
        regions: data.regions || [],
        cities: data.cities || [],
        allowedIPs: data.allowedIPs || [],
        blockedIPs: data.blockedIPs || [],
        blockVPNs: data.blockVPNs || false,
        blockProxies: data.blockProxies || false,
        blockTor: data.blockTor || false,
        blockDataCenters: data.blockDataCenters || false,
        requireMFA: data.requireMFA || false,
        bypassRoles: data.bypassRoles || [],
        blockAction: data.blockAction || 'RETURN_403',
        priority: data.priority || 0
      }
    });
  }

  /**
   * Update a GeoLock rule
   */
  async updateRule(id: string, data: Partial<GeoLockModel>): Promise<GeoLockModel> {
    return await prisma.geoLockConfig.update({
      where: { id },
      data
    });
  }

  /**
   * Delete a GeoLock rule
   */
  async deleteRule(id: string): Promise<void> {
    await prisma.geoLockConfig.delete({ where: { id } });
  }

  /**
   * List all GeoLock rules
   */
  async listRules(activeOnly = false): Promise<GeoLockModel[]> {
    return await prisma.geoLockConfig.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { priority: 'desc' }
    });
  }
}

export const geoLockService = new GeoLockService();
