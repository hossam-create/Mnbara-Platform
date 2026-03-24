/**
 * 🔒 SECURITY-COMPLIANT RATE LIMITING & ANTI-BOT PROTECTION
 * ACCESS CONTROL & AUTHORITY POLICY IMPLEMENTATION
 * 
 * CRITICAL SECURITY NOTICE:
 * - Rate limiting is SECURITY-CRITICAL for preventing DoS and brute force attacks
 * - Backend validates ALL rate limiting decisions independently
 * - Anti-bot protection prevents automated attacks and spam
 * - Rate limits are enforced server-side with frontend monitoring
 * - IP-based and user-based rate limiting provides comprehensive protection
 * 
 * VIOLATION OF RATE LIMITING POLICY COMPROMISES SYSTEM SECURITY
 */

import { 
  useSecurityEventLogging, 
  EventCategory, 
  EventType, 
  TargetType 
} from '@/hooks/useSecurityEventLogging';

/**
 * ⚠️ SECURITY: Rate Limiting Configuration
 * Backend enforces ALL limits - Frontend monitoring is cosmetic only
 */
export const RATE_LIMITING_CONFIG = {
  // Authentication endpoints
  LOGIN_ATTEMPTS: {
    MAX_ATTEMPTS: 5,
    TIME_WINDOW: 15 * 60 * 1000, // 15 minutes
    BLOCK_DURATION: 30 * 60 * 1000, // 30 minutes
    SECURITY_LEVEL: 'HIGH'
  },
  
  // Form submissions
  FORM_SUBMISSIONS: {
    MAX_ATTEMPTS: 10,
    TIME_WINDOW: 5 * 60 * 1000, // 5 minutes
    BLOCK_DURATION: 15 * 60 * 1000, // 15 minutes
    SECURITY_LEVEL: 'MEDIUM'
  },
  
  // API requests
  API_REQUESTS: {
    MAX_REQUESTS: 100,
    TIME_WINDOW: 60 * 1000, // 1 minute
    BLOCK_DURATION: 5 * 60 * 1000, // 5 minutes
    SECURITY_LEVEL: 'HIGH'
  },
  
  // Image uploads
  IMAGE_UPLOADS: {
    MAX_UPLOADS: 10,
    TIME_WINDOW: 60 * 60 * 1000, // 1 hour
    BLOCK_DURATION: 2 * 60 * 60 * 1000, // 2 hours
    SECURITY_LEVEL: 'MEDIUM'
  },
  
  // Payment attempts
  PAYMENT_ATTEMPTS: {
    MAX_ATTEMPTS: 3,
    TIME_WINDOW: 24 * 60 * 60 * 1000, // 24 hours
    BLOCK_DURATION: 48 * 60 * 60 * 1000, // 48 hours
    SECURITY_LEVEL: 'CRITICAL'
  },
  
  // Search queries
  SEARCH_QUERIES: {
    MAX_QUERIES: 50,
    TIME_WINDOW: 60 * 1000, // 1 minute
    BLOCK_DURATION: 10 * 60 * 1000, // 10 minutes
    SECURITY_LEVEL: 'LOW'
  },
  
  // General rate limiting
  GENERAL_REQUESTS: {
    MAX_REQUESTS: 200,
    TIME_WINDOW: 60 * 1000, // 1 minute
    BLOCK_DURATION: 3 * 60 * 1000, // 3 minutes
    SECURITY_LEVEL: 'MEDIUM'
  }
} as const;

/**
 * ⚠️ SECURITY: Anti-Bot Configuration
 * Backend validates ALL bot detection - Frontend monitoring is cosmetic only
 */
export const ANTI_BOT_CONFIG = {
  // Cloudflare Turnstile
  TURNSTILE: {
    SITE_KEY: process.env.REACT_APP_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
    SECRET_KEY: process.env.REACT_APP_TURNSTILE_SECRET_KEY,
    THEME: 'dark',
    SIZE: 'normal',
    LANGUAGE: 'en',
    RETRY: 'auto',
    SECURITY_LEVEL: 'HIGH'
  },
  
  // Google reCAPTCHA
  RECAPTCHA: {
    SITE_KEY: process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
    SECRET_KEY: process.env.REACT_APP_RECAPTCHA_SECRET_KEY,
    VERSION: 'v2',
    THEME: 'dark',
    SIZE: 'normal',
    SECURITY_LEVEL: 'HIGH'
  },
  
  // Behavioral analysis
  BEHAVIORAL: {
    MIN_HUMAN_LIKENESS: 0.7,
    MAX_BOT_LIKENESS: 0.3,
    ANALYSIS_WINDOW: 30 * 1000, // 30 seconds
    SECURITY_LEVEL: 'MEDIUM'
  },
  
  // IP reputation
  IP_REPUTATION: {
    BLOCK_SUSPICIOUS_IPS: true,
    BLOCK_TOR_EXIT_NODES: true,
    BLOCK_PROXY_IPS: true,
    SECURITY_LEVEL: 'HIGH'
  },
  
  // Request fingerprinting
  FINGERPRINTING: {
    ENABLE_DEVICE_FINGERPRINT: true,
    ENABLE_BROWSER_FINGERPRINT: true,
    ENABLE_NETWORK_FINGERPRINT: true,
    SECURITY_LEVEL: 'MEDIUM'
  }
} as const;

/**
 * 🔒 SECURITY-CRITICAL: Rate Limiting Result
 * Backend validates ALL rate limiting decisions
 */
export interface RateLimitingResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  limit: number;
  window: number;
  blocked: boolean;
  blockDuration?: number;
  reason: string;
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  violationType?: 'RATE_LIMIT' | 'BOT_DETECTION' | 'SUSPICIOUS_BEHAVIOR';
}

/**
 * 🔒 SECURITY: Anti-Bot Verification Result
 * Backend validates ALL bot detection results
 */
export interface AntiBotVerificationResult {
  success: boolean;
  score: number;
  humanLikeness: number;
  botLikeness: number;
  action: 'ALLOW' | 'CHALLENGE' | 'BLOCK';
  reason: string;
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  verificationMethod: 'TURNSTILE' | 'RECAPTCHA' | 'BEHAVIORAL' | 'FINGERPRINT';
}

/**
 * 🔒 SECURITY: Rate Limiting Service
 * Backend enforces ALL limits - Frontend monitoring is cosmetic only
 */
export class RateLimitingService {
  private static instance: RateLimitingService;
  private rateLimitCache = new Map<string, RateLimitingResult>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private { createSecurityEvent } = useSecurityEventLogging();
  
  private constructor() {
    // SECURITY: Start cleanup interval
    this.startCleanupInterval();
  }
  
  /**
   * ⚠️ SECURITY: Singleton pattern ensures centralized rate limiting
   * Backend enforces ALL limits - Frontend monitoring is cosmetic only
   */
  public static getInstance(): RateLimitingService {
    if (!RateLimitingService.instance) {
      RateLimitingService.instance = new RateLimitingService();
    }
    return RateLimitingService.instance;
  }
  
  /**
   * ⚠️ SECURITY: Check rate limit - Backend validates ALL decisions
   * Frontend checks are COSMETIC ONLY - Backend enforces independently
   */
  async checkRateLimit(
    identifier: string,
    limitType: keyof typeof RATE_LIMITING_CONFIG,
    metadata?: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      endpoint?: string;
    }
  ): Promise<RateLimitingResult> {
    const config = RATE_LIMITING_CONFIG[limitType];
    const cacheKey = `${limitType}:${identifier}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY AUDIT] Checking rate limit:', {
        identifier,
        limit_type: limitType,
        max_attempts: config.MAX_ATTEMPTS || config.MAX_REQUESTS,
        time_window: config.TIME_WINDOW,
        warning: 'Frontend check is COSMETIC ONLY',
        security: 'Backend enforces ALL rate limits independently'
      });
    }
    
    try {
      // SECURITY: Request backend rate limit validation
      const response = await fetch('/api/v1/security/rate-limit/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'X-Rate-Limit-Type': limitType,
          'X-Rate-Limit-Identifier': identifier
        },
        body: JSON.stringify({
          identifier,
          limit_type: limitType,
          metadata: metadata || {},
          security_validation: true
        })
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          // SECURITY: Rate limit exceeded - backend blocked
          const retryAfter = response.headers.get('Retry-After');
          const result: RateLimitingResult = {
            allowed: false,
            remaining: 0,
            resetTime: Date.now() + (parseInt(retryAfter || '60') * 1000),
            retryAfter: parseInt(retryAfter || '60'),
            limit: config.MAX_ATTEMPTS || config.MAX_REQUESTS,
            window: config.TIME_WINDOW,
            blocked: true,
            blockDuration: config.BLOCK_DURATION,
            reason: 'Rate limit exceeded - Backend enforcement',
            securityLevel: config.SECURITY_LEVEL as any,
            violationType: 'RATE_LIMIT'
          };
          
          // SECURITY: Log rate limit violation
          await this.createSecurityEvent(
            EventCategory.SECURITY,
            EventType.SECURITY_ALERT,
            TargetType.SYSTEM,
            `rate-limit-exceeded-${identifier}`,
            {
              metadata: {
                limit_type: limitType,
                retry_after: retryAfter,
                security_level: config.SECURITY_LEVEL
              }
            },
            'RateLimitingService'
          );
          
          return result;
        }
        
        if (response.status === 403) {
          throw new Error('Rate limit check unauthorized - insufficient permissions');
        }
        
        throw new Error(`Rate limit check failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result as RateLimitingResult;
      
    } catch (error: any) {
      console.error('[SECURITY CRITICAL] Rate limit check failed:', error);
      
      // SECURITY: Log rate limit check failure
      await this.createSecurityEvent(
        EventCategory.ERROR,
        EventType.SYSTEM_ERROR,
        TargetType.SYSTEM,
        `rate-limit-check-failed-${identifier}`,
        {
          metadata: {
            limit_type: limitType,
            error: error.message,
            security_level: 'HIGH'
          }
        },
        'RateLimitingService'
      );
      
      // SECURITY: Return safe default (block access on error)
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000, // 1 minute
        limit: config.MAX_ATTEMPTS || config.MAX_REQUESTS,
        window: config.TIME_WINDOW,
        blocked: true,
        reason: 'Rate limit check failed - Security precaution',
        securityLevel: 'HIGH',
        violationType: 'SUSPICIOUS_BEHAVIOR'
      };
    }
  }
  
  /**
   * ⚠️ SECURITY: Record rate limit usage - Backend validates ALL records
   */
  async recordRateLimitUsage(
    identifier: string,
    limitType: keyof typeof RATE_LIMITING_CONFIG,
    success: boolean,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const response = await fetch('/api/v1/security/rate-limit/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          identifier,
          limit_type: limitType,
          success,
          metadata: metadata || {},
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        console.error('[SECURITY WARNING] Failed to record rate limit usage');
      }
      
    } catch (error) {
      console.error('[SECURITY CRITICAL] Failed to record rate limit usage:', error);
    }
  }
  
  /**
   * ⚠️ SECURITY: Get rate limit statistics - Backend validates ALL data
   */
  async getRateLimitStatistics(
    identifier?: string,
    limitType?: keyof typeof RATE_LIMITING_CONFIG
  ): Promise<{
    totalViolations: number;
    recentViolations: number;
    blockedIdentifiers: string[];
    statisticsByType: Record<string, {
      violations: number;
      blocked: number;
      lastViolation: string | null;
    }>;
  }> {
    try {
      const params = new URLSearchParams();
      if (identifier) params.append('identifier', identifier);
      if (limitType) params.append('limit_type', limitType);
      
      const response = await fetch(`/api/v1/security/rate-limit/statistics?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get rate limit statistics');
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('[SECURITY CRITICAL] Failed to get rate limit statistics:', error);
      
      return {
        totalViolations: 0,
        recentViolations: 0,
        blockedIdentifiers: [],
        statisticsByType: {}
      };
    }
  }
  
  /**
   * ⚠️ SECURITY: Get authentication token
   */
  private getAuthToken(): string {
    // SECURITY: Get token from secure storage
    const state = (window as any).store?.getState?.();
    return state?.auth?.token || '';
  }
  
  /**
   * ⚠️ SECURITY: Start cleanup interval
   */
  private startCleanupInterval(): void {
    // SECURITY: Clean up old rate limit entries every hour
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const expiredKeys: string[] = [];
      
      this.rateLimitCache.forEach((result, key) => {
        if (now > result.resetTime) {
          expiredKeys.push(key);
        }
      });
      
      expiredKeys.forEach(key => {
        this.rateLimitCache.delete(key);
      });
      
      if (process.env.NODE_ENV === 'development' && expiredKeys.length > 0) {
        console.log('[SECURITY AUDIT] Cleaned up expired rate limit entries:', expiredKeys.length);
      }
    }, 60 * 60 * 1000); // 1 hour
  }
}

/**
 * 🔒 SECURITY: Anti-Bot Protection Service
 * Backend validates ALL bot detection - Frontend monitoring is cosmetic only
 */
export class AntiBotProtectionService {
  private static instance: AntiBotProtectionService;
  private { createSecurityEvent } = useSecurityEventLogging();
  
  private constructor() {}
  
  /**
   * ⚠️ SECURITY: Singleton pattern ensures centralized bot protection
   * Backend validates ALL bot detection - Frontend monitoring is cosmetic only
   */
  public static getInstance(): AntiBotProtectionService {
    if (!AntiBotProtectionService.instance) {
      AntiBotProtectionService.instance = new AntiBotProtectionService();
    }
    return AntiBotProtectionService.instance;
  }
  
  /**
   * ⚠️ SECURITY: Verify Cloudflare Turnstile - Backend validates ALL verification
   */
  async verifyTurnstile(token: string, metadata?: Record<string, any>): Promise<AntiBotVerificationResult> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY AUDIT] Verifying Turnstile token:', {
        token_length: token.length,
        warning: 'Frontend verification is COSMETIC ONLY',
        security: 'Backend validates ALL bot detection independently'
      });
    }
    
    try {
      const response = await fetch('/api/v1/security/bot/verify-turnstile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          token,
          metadata: metadata || {},
          security_validation: true
        })
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Turnstile verification unauthorized');
        }
        
        throw new Error(`Turnstile verification failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result as AntiBotVerificationResult;
      
    } catch (error: any) {
      console.error('[SECURITY CRITICAL] Turnstile verification failed:', error);
      
      // SECURITY: Log verification failure
      await this.createSecurityEvent(
        EventCategory.ERROR,
        EventType.SYSTEM_ERROR,
        TargetType.SYSTEM,
        'turnstile-verification-failed',
        {
          metadata: {
            error: error.message,
            security_level: 'HIGH'
          }
        },
        'AntiBotProtectionService'
      );
      
      // SECURITY: Return safe default (block on error)
      return {
        success: false,
        score: 0,
        humanLikeness: 0,
        botLikeness: 1,
        action: 'BLOCK',
        reason: 'Verification failed - Security precaution',
        securityLevel: 'HIGH',
        verificationMethod: 'TURNSTILE'
      };
    }
  }
  
  /**
   * ⚠️ SECURITY: Verify Google reCAPTCHA - Backend validates ALL verification
   */
  async verifyRecaptcha(token: string, action: string, metadata?: Record<string, any>): Promise<AntiBotVerificationResult> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY AUDIT] Verifying reCAPTCHA token:', {
        action,
        token_length: token.length,
        warning: 'Frontend verification is COSMETIC ONLY',
        security: 'Backend validates ALL bot detection independently'
      });
    }
    
    try {
      const response = await fetch('/api/v1/security/bot/verify-recaptcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          token,
          action,
          metadata: metadata || {},
          security_validation: true
        })
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('reCAPTCHA verification unauthorized');
        }
        
        throw new Error(`reCAPTCHA verification failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result as AntiBotVerificationResult;
      
    } catch (error: any) {
      console.error('[SECURITY CRITICAL] reCAPTCHA verification failed:', error);
      
      // SECURITY: Log verification failure
      await this.createSecurityEvent(
        EventCategory.ERROR,
        EventType.SYSTEM_ERROR,
        TargetType.SYSTEM,
        'recaptcha-verification-failed',
        {
          metadata: {
            action,
            error: error.message,
            security_level: 'HIGH'
          }
        },
        'AntiBotProtectionService'
      );
      
      // SECURITY: Return safe default (block on error)
      return {
        success: false,
        score: 0,
        humanLikeness: 0,
        botLikeness: 1,
        action: 'BLOCK',
        reason: 'Verification failed - Security precaution',
        securityLevel: 'HIGH',
        verificationMethod: 'RECAPTCHA'
      };
    }
  }
  
  /**
   * ⚠️ SECURITY: Analyze behavioral patterns - Backend validates ALL analysis
   */
  async analyzeBehavioralPatterns(
    sessionData: {
      mouseMovements: Array<{ x: number; y: number; timestamp: number }>;
      keystrokes: Array<{ key: string; timestamp: number }>;
      scrollEvents: Array<{ delta: number; timestamp: number }>;
      clickEvents: Array<{ x: number; y: number; timestamp: number }>;
      timeOnPage: number;
    },
    metadata?: Record<string, any>
  ): Promise<AntiBotVerificationResult> {
    try {
      const response = await fetch('/api/v1/security/bot/analyze-behavior', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          session_data: sessionData,
          metadata: metadata || {},
          security_validation: true
        })
      });
      
      if (!response.ok) {
        throw new Error('Behavioral analysis failed');
      }
      
      const result = await response.json();
      return result as AntiBotVerificationResult;
      
    } catch (error: any) {
      console.error('[SECURITY CRITICAL] Behavioral analysis failed:', error);
      
      // SECURITY: Return safe default (block on error)
      return {
        success: false,
        score: 0.5,
        humanLikeness: 0.5,
        botLikeness: 0.5,
        action: 'CHALLENGE',
        reason: 'Analysis failed - Additional verification required',
        securityLevel: 'MEDIUM',
        verificationMethod: 'BEHAVIORAL'
      };
    }
  }
  
  /**
   * ⚠️ SECURITY: Get authentication token
   */
  private getAuthToken(): string {
    // SECURITY: Get token from secure storage
    const state = (window as any).store?.getState?.();
    return state?.auth?.token || '';
  }
}

/**
 * ⚠️ SECURITY: Behavioral Analysis Hook
 * Collects user behavior data for bot detection
 */
export function useBehavioralAnalysis() {
  const [sessionData, setSessionData] = useState({
    mouseMovements: [] as Array<{ x: number; y: number; timestamp: number }>,
    keystrokes: [] as Array<{ key: string; timestamp: number }>,
    scrollEvents: [] as Array<{ delta: number; timestamp: number }>,
    clickEvents: [] as Array<{ x: number; y: number; timestamp: number }>,
    timeOnPage: 0
  });
  
  const startTime = useRef(Date.now());
  const isCollecting = useRef(false);
  
  useEffect(() => {
    if (isCollecting.current) return;
    isCollecting.current = true;
    
    // Collect mouse movements
    const handleMouseMove = (e: MouseEvent) => {
      if (sessionData.mouseMovements.length < 1000) { // Limit data collection
        setSessionData(prev => ({
          ...prev,
          mouseMovements: [...prev.mouseMovements, {
            x: e.clientX,
            y: e.clientY,
            timestamp: Date.now()
          }]
        }));
      }
    };
    
    // Collect keystrokes (excluding sensitive fields)
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      if (sessionData.keystrokes.length < 500) { // Limit data collection
        setSessionData(prev => ({
          ...prev,
          keystrokes: [...prev.keystrokes, {
            key: e.key,
            timestamp: Date.now()
          }]
        }));
      }
    };
    
    // Collect scroll events
    const handleScroll = () => {
      if (sessionData.scrollEvents.length < 200) { // Limit data collection
        setSessionData(prev => ({
          ...prev,
          scrollEvents: [...prev.scrollEvents, {
            delta: window.scrollY,
            timestamp: Date.now()
          }]
        }));
      }
    };
    
    // Collect click events
    const handleClick = (e: MouseEvent) => {
      if (sessionData.clickEvents.length < 100) { // Limit data collection
        setSessionData(prev => ({
          ...prev,
          clickEvents: [...prev.clickEvents, {
            x: e.clientX,
            y: e.clientY,
            timestamp: Date.now()
          }]
        }));
      }
    };
    
    // Update time on page
    const interval = setInterval(() => {
      setSessionData(prev => ({
        ...prev,
        timeOnPage: Date.now() - startTime.current
      }));
    }, 1000);
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('scroll', handleScroll);
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
      clearInterval(interval);
      isCollecting.current = false;
    };
  }, []);
  
  return sessionData;
}

/**
 * ⚠️ SECURITY: Rate Limiting Hook
 * Provides rate limiting functionality with backend validation
 */
export function useRateLimiting() {
  const [rateLimitResults, setRateLimitResults] = useState<Record<string, RateLimitingResult>>({});
  const rateLimitingService = RateLimitingService.getInstance();
  
  const checkRateLimit = useCallback(async (
    identifier: string,
    limitType: keyof typeof RATE_LIMITING_CONFIG,
    metadata?: Record<string, any>
  ): Promise<RateLimitingResult> => {
    const result = await rateLimitingService.checkRateLimit(identifier, limitType, metadata);
    
    setRateLimitResults(prev => ({
      ...prev,
      [`${limitType}:${identifier}`]: result
    }));
    
    return result;
  }, [rateLimitingService]);
  
  const recordUsage = useCallback(async (
    identifier: string,
    limitType: keyof typeof RATE_LIMITING_CONFIG,
    success: boolean,
    metadata?: Record<string, any>
  ): Promise<void> => {
    await rateLimitingService.recordRateLimitUsage(identifier, limitType, success, metadata);
  }, [rateLimitingService]);
  
  return {
    checkRateLimit,
    recordUsage,
    rateLimitResults
  };
}

/**
 * ⚠️ SECURITY: Anti-Bot Hook
 * Provides anti-bot verification functionality
 */
export function useAntiBotProtection() {
  const antiBotService = AntiBotProtectionService.getInstance();
  const [verificationResults, setVerificationResults] = useState<Record<string, AntiBotVerificationResult>>({});
  
  const verifyTurnstile = useCallback(async (
    token: string,
    metadata?: Record<string, any>
  ): Promise<AntiBotVerificationResult> => {
    const result = await antiBotService.verifyTurnstile(token, metadata);
    
    setVerificationResults(prev => ({
      ...prev,
      [`turnstile:${token}`]: result
    }));
    
    return result;
  }, [antiBotService]);
  
  const verifyRecaptcha = useCallback(async (
    token: string,
    action: string,
    metadata?: Record<string, any>
  ): Promise<AntiBotVerificationResult> => {
    const result = await antiBotService.verifyRecaptcha(token, action, metadata);
    
    setVerificationResults(prev => ({
      ...prev,
      [`recaptcha:${token}:${action}`]: result
    }));
    
    return result;
  }, [antiBotService]);
  
  const analyzeBehavior = useCallback(async (
    sessionData: Parameters<typeof antiBotService.analyzeBehavioralPatterns>[0],
    metadata?: Record<string, any>
  ): Promise<AntiBotVerificationResult> => {
    const result = await antiBotService.analyzeBehavioralPatterns(sessionData, metadata);
    
    setVerificationResults(prev => ({
      ...prev,
      [`behavioral:${Date.now()}`]: result
    }));
    
    return result;
  }, [antiBotService]);
  
  return {
    verifyTurnstile,
    verifyRecaptcha,
    analyzeBehavior,
    verificationResults
  };
}

/**
 * ⚠️ SECURITY: Export singleton instances
 */
export const rateLimitingService = RateLimitingService.getInstance();
export const antiBotProtectionService = AntiBotProtectionService.getInstance();