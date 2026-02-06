// IP Detection Service
// خدمة كشف الموقع من خلال IP

import geoip from 'geoip-lite';
import axios from 'axios';
import { IPLocation, GPSLocation, LocationFusion } from '../types';
import { logger } from '../utils/logger';

export class IPDetectionService {
  /**
   * Detect location from IP address
   */
  async detectFromIP(ip: string): Promise<IPLocation> {
    try {
      // Skip private IP ranges
      if (this.isPrivateIP(ip)) {
        return this.getPrivateIPLocation(ip);
      }

      // Use geoip-lite for basic lookup
      const geoData = geoip.lookup(ip) || {};
      
      // Try to get more detailed data from external API (optional)
      let enhancedData = {};
      if (process.env.IP_API_URL) {
        try {
          const response = await axios.get(`${process.env.IP_API_URL}${ip}/json/`);
          enhancedData = response.data;
        } catch (apiError) {
          logger.debug('IP API lookup failed, using geoip-lite only');
        }
      }

      // Parse IP version
      const ipVersion = ip.includes(':') ? 6 : 4;

      return {
        ip,
        ipVersion,
        country: (geoData.country && geoData.country.names?.en) || (enhancedData as any).country_name || null,
        countryCode: (geoData.country && geoData.country.iso_code) || (enhancedData as any).country_code || null,
        region: (geoData.subdivisions && geoData.subdivisions[0]?.names?.en) || (enhancedData as any).region || null,
        regionCode: (geoData.subdivisions && geoData.subdivisions[0]?.iso_code) || (enhancedData as any).region_code || null,
        city: (geoData.city && geoData.city.names?.en) || (enhancedData as any).city || null,
        cityCode: (enhancedData as any).city_code || null,
        postalCode: (geoData.postal && geoData.postal.code) || (enhancedData as any).postal || null,
        latitude: (geoData.location && geoData.location.latitude) || (enhancedData as any).latitude || null,
        longitude: (geoData.location && geoData.location.longitude) || (enhancedData as any).longitude || null,
        timezone: (geoData.location && geoData.location.time_zone) || (enhancedData as any).timezone || null,
        isInEU: (enhancedData as any).in_eu || null,
        isp: (enhancedData as any).org || (enhancedData as any).isp || null,
        organization: (enhancedData as any).org || null,
        asn: (enhancedData as any).asn || null
      };
    } catch (error) {
      logger.error('IP detection error:', error);
      return {
        ip,
        ipVersion: ip.includes(':') ? 6 : 4,
        country: null,
        countryCode: null,
        region: null,
        regionCode: null,
        city: null,
        cityCode: null,
        postalCode: null,
        latitude: null,
        longitude: null,
        timezone: null,
        isInEU: null,
        isp: null,
        organization: null,
        asn: null
      };
    }
  }

  /**
   * Detect network characteristics (VPN, Proxy, Tor)
   */
  async detectNetworkType(ip: string, location: IPLocation): Promise<{
    isVPN: boolean;
    isProxy: boolean;
    isTor: boolean;
    isDataCenter: boolean;
    isResidential: boolean;
    isMobile: boolean;
    isHosting: boolean;
  }> {
    try {
      // Basic detection based on IP ranges and data
      const isVPN = this.detectVPN(location);
      const isProxy = this.detectProxy(location);
      const isTor = this.detectTor(location);
      const isDataCenter = this.detectDataCenter(location);
      const isResidential = !isDataCenter && !isVPN && !isProxy;
      const isMobile = this.detectMobile(location);
      const isHosting = this.detectHosting(location);

      return {
        isVPN,
        isProxy,
        isTor,
        isDataCenter,
        isResidential,
        isMobile,
        isHosting
      };
    } catch (error) {
      logger.error('Network type detection error:', error);
      return {
        isVPN: false,
        isProxy: false,
        isTor: false,
        isDataCenter: false,
        isResidential: true,
        isMobile: false,
        isHosting: false
      };
    }
  }

  /**
   * Fuse IP and GPS location data
   */
  async fuseLocation(
    ip: string,
    gpsLocation?: GPSLocation
  ): Promise<LocationFusion> {
    const ipLocation = await this.detectFromIP(ip);
    const networkType = await this.detectNetworkType(ip, ipLocation);

    // Calculate risk based on network type
    let riskScore = 0;
    if (networkType.isVPN) riskScore += 30;
    if (networkType.isProxy) riskScore += 40;
    if (networkType.isTor) riskScore += 70;
    if (networkType.isDataCenter) riskScore += 20;
    if (networkType.isHosting) riskScore += 15;

    // Check for GPS/IP mismatch
    let mismatchDetected = false;
    let mismatchDistance: number | null = null;
    let confidence = 0.7; // Default confidence for IP-only
    let fusedLocation = ipLocation.latitude && ipLocation.longitude
      ? { latitude: ipLocation.latitude, longitude: ipLocation.longitude }
      : null;

    if (gpsLocation && ipLocation.latitude && ipLocation.longitude) {
      mismatchDistance = this.calculateDistance(
        { lat: gpsLocation.latitude, lng: gpsLocation.longitude },
        { lat: ipLocation.latitude, lng: ipLocation.longitude }
      );
      
      // If GPS is available, use it as the primary source
      fusedLocation = { latitude: gpsLocation.latitude, longitude: gpsLocation.longitude };
      confidence = 0.95;

      // Flag mismatch if distance > 100km
      if (mismatchDistance > 100) {
        mismatchDetected = true;
        riskScore += Math.min(mismatchDistance / 10, 50); // Cap additional risk
      }
    } else if (gpsLocation) {
      // GPS-only (no IP location)
      fusedLocation = { latitude: gpsLocation.latitude, longitude: gpsLocation.longitude };
      confidence = 0.9;
    }

    return {
      ipLocation,
      gpsLocation: gpsLocation || null,
      fusedLocation,
      confidence,
      isTrusted: networkType.isResidential && !mismatchDetected,
      mismatchDetected,
      mismatchDistance,
      riskScore
    };
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
        Math.cos(this.toRad(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Check if IP is private
   */
  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^127\./,
      /^::1$/,
      /^fe80:/,
      /^fc00:/,
      /^fd[0-9a-f]{2}:/
    ];
    return privateRanges.some(range => range.test(ip));
  }

  /**
   * Get location for private IPs
   */
  private getPrivateIPLocation(ip: string): IPLocation {
    return {
      ip,
      ipVersion: ip.includes(':') ? 6 : 4,
      country: 'Private',
      countryCode: 'XX',
      region: null,
      regionCode: null,
      city: null,
      cityCode: null,
      postalCode: null,
      latitude: null,
      longitude: null,
      timezone: null,
      isInEU: null,
      isp: 'Private Network',
      organization: 'Private Network',
      asn: null
    };
  }

  // Detection heuristics
  private detectVPN(location: IPLocation): boolean {
    const vpnKeywords = ['vpn', 'virtual', 'proxy', 'hosting'];
    const org = (location.organization || '').toLowerCase();
    const isp = (location.isp || '').toLowerCase();
    return vpnKeywords.some(keyword => org.includes(keyword) || isp.includes(keyword));
  }

  private detectProxy(location: IPLocation): boolean {
    const proxyKeywords = ['proxy', 'squid', 'nginx', 'apache'];
    const org = (location.organization || '').toLowerCase();
    return proxyKeywords.some(keyword => org.includes(keyword));
  }

  private detectTor(location: IPLocation): boolean {
    const torKeywords = ['tor', 'onion'];
    const org = (location.organization || '').toLowerCase();
    return torKeywords.some(keyword => org.includes(keyword));
  }

  private detectDataCenter(location: IPLocation): boolean {
    const dcKeywords = ['amazon', 'google', 'microsoft', 'apple', 'facebook', 
                         'digitalocean', 'linode', 'vultr', 'cloudflare', 'aws',
                         'azure', 'data center', 'datacenter', 'server'];
    const org = (location.organization || '').toLowerCase();
    const isp = (location.isp || '').toLowerCase();
    return dcKeywords.some(keyword => org.includes(keyword) || isp.includes(keyword));
  }

  private detectMobile(location: IPLocation): boolean {
    const mobileKeywords = ['mobile', 'cellular', 'verizon', 'at&t', 't-mobile', 
                           'vodafone', 'orange', 'telecom'];
    const isp = (location.isp || '').toLowerCase();
    return mobileKeywords.some(keyword => isp.includes(keyword));
  }

  private detectHosting(location: IPLocation): boolean {
    const hostingKeywords = ['hosting', 'host', 'web', 'server', 'colocation'];
    const org = (location.organization || '').toLowerCase();
    const isp = (location.isp || '').toLowerCase();
    return hostingKeywords.some(keyword => org.includes(keyword) || isp.includes(keyword));
  }
}

export const ipDetectionService = new IPDetectionService();
