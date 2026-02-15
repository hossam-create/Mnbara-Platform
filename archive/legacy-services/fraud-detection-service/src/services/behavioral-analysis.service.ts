// Behavioral Analysis Service
// خدمة التحليل السلوكي - User behavior analysis and anomaly detection

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface BehavioralInput {
  userId: string;
  sessionId: string;
  
  // Navigation Behavior
  pageViews: number;
  pagesVisited: string[];
  avgTimePerPage: number;
  totalSessionDuration: number;
  
  // Mouse/Touch Behavior
  mouseMovements: number;
  mouseSpeed: number;
  clickCount: number;
  scrollDepth: number;
  scrollBehavior: 'smooth' | 'jumpy' | 'normal';
  touchEvents: number;
  
  // Typing Behavior
  typingSpeed: number; // chars per minute
  pasteEvents: number;
  backspaceRatio: number;
  keystrokeTiming: number[]; // array of inter-keystroke times
  
  // Interaction Patterns
  cartInteractions: number;
  wishlistInteractions: number;
  searchQueries: number;
  filterUsage: string[];
  
  // Time Information
  hourOfDay: number;
  dayOfWeek: number;
  timezone: string;
  
  // Device Info
  deviceType: string;
  deviceFingerprintId?: string;
  
  // Location
  country: string;
  city?: string;
}

export interface BehavioralAnalysisResult {
  userId: string;
  anomalyScore: number; // 0-100
  deviationScore: number; // deviation from baseline
  behaviorDrift: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  anomalies: {
    type: string;
    severity: number;
    description: string;
  }[];
  recommendations: string[];
  isHuman: boolean;
  confidence: number;
}

export interface BehavioralBaseline {
  avgSessionDuration: number;
  avgPagesPerSession: number;
  avgTimeToPurchase: number;
  avgTypingSpeed: number;
  avgMouseSpeed: number;
  typicalHourStart: number;
  typicalHourEnd: number;
  preferredDevice: string;
  typicalCountries: string[];
  browsingPattern: 'NORMAL' | 'HEAVY' | 'LIGHT';
}

export class BehavioralAnalysisService {
  // Thresholds for anomaly detection
  private readonly THRESHOLDS = {
    mouseSpeedHigh: 150, // pixels per second
    mouseSpeedLow: 5,
    typingSpeedHigh: 500,
    typingSpeedLow: 20,
    pasteHigh: 5,
    scrollJumpy: 3,
    sessionDurationShort: 30, // seconds
    sessionDurationLong: 3600,
    anomalyScoreMedium: 30,
    anomalyScoreHigh: 60,
    anomalyScoreCritical: 85
  };

  // Analyze current session behavior
  async analyzeBehavior(input: BehavioralInput): Promise<BehavioralAnalysisResult> {
    const anomalies: { type: string; severity: number; description: string }[] = [];
    let totalAnomalyScore = 0;

    // Get user's baseline behavior
    const baseline = await this.getUserBaseline(input.userId);
    const behaviorProfile = await this.getOrCreateBehaviorProfile(input.userId);

    // 1. Mouse Movement Analysis
    const mouseAnomaly = this.analyzeMouseBehavior(input);
    if (mouseAnomaly) {
      anomalies.push(mouseAnomaly);
      totalAnomalyScore += mouseAnomaly.severity;
    }

    // 2. Typing Pattern Analysis
    const typingAnomaly = this.analyzeTypingBehavior(input);
    if (typingAnomaly) {
      anomalies.push(typingAnomaly);
      totalAnomalyScore += typingAnomaly.severity;
    }

    // 3. Navigation Pattern Analysis
    const navAnomaly = this.analyzeNavigationBehavior(input, baseline);
    if (navAnomaly) {
      anomalies.push(navAnomaly);
      totalAnomalyScore += navAnomaly.severity;
    }

    // 4. Time Pattern Analysis
    const timeAnomaly = this.analyzeTimeBehavior(input, baseline);
    if (timeAnomaly) {
      anomalies.push(timeAnomaly);
      totalAnomalyScore += timeAnomaly.severity;
    }

    // 5. Geographic Consistency
    const geoAnomaly = this.analyzeGeographicConsistency(input, behaviorProfile);
    if (geoAnomaly) {
      anomalies.push(geoAnomaly);
      totalAnomalyScore += geoAnomaly.severity;
    }

    // 6. Device Consistency
    const deviceAnomaly = this.analyzeDeviceConsistency(input, behaviorProfile);
    if (deviceAnomaly) {
      anomalies.push(deviceAnomaly);
      totalAnomalyScore += deviceAnomaly.severity;
    }

    // 7. Bot Detection
    const botAnomaly = this.detectBotBehavior(input);
    if (botAnomaly) {
      anomalies.push(botAnomaly);
      totalAnomalyScore += botAnomaly.severity;
    }

    // Calculate deviation from baseline
    const deviationScore = this.calculateDeviationScore(input, baseline, behaviorProfile);

    // Update behavior profile with current session
    await this.updateBehaviorProfile(input);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(totalAnomalyScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(anomalies, totalAnomalyScore);

    // Determine if likely human
    const isHuman = totalAnomalyScore < 70;
    const confidence = Math.max(0, 100 - totalAnomalyScore);

    return {
      userId: input.userId,
      anomalyScore: totalAnomalyScore,
      deviationScore,
      behaviorDrift: behaviorProfile?.behaviorDriftScore || 0,
      riskLevel,
      anomalies,
      recommendations,
      isHuman,
      confidence
    };
  }

  // Analyze mouse behavior
  private analyzeMouseBehavior(input: BehavioralInput): { type: string; severity: number; description: string } | null {
    // Check for suspiciously smooth mouse movements (bot-like)
    if (input.mouseSpeed > this.THRESHOLDS.mouseSpeedHigh * 2) {
      return {
        type: 'ROBOTIC_MOUSE',
        severity: 70,
        description: 'Mouse movements are unnaturally smooth and fast'
      };
    }

    // Check for suspiciously slow/no mouse movement
    if (input.mouseMovements < 10 && input.pageViews > 5) {
      return {
        type: 'UNNATURAL_MOUSE_LACK',
        severity: 40,
        description: 'Low mouse movement despite page navigation'
      };
    }

    // Check for jumpy scrolling
    if (input.scrollBehavior === 'jumpy' && input.scrollDepth < 20) {
      return {
        type: 'JUMPY_SCROLLING',
        severity: 25,
        description: 'Irregular scrolling pattern detected'
      };
    }

    // Check for excessive pasting
    if (input.pasteEvents > this.THRESHOLDS.pasteHigh) {
      return {
        type: 'EXCESSIVE_PASTE',
        severity: 20,
        description: 'High number of paste events detected'
      };
    }

    return null;
  }

  // Analyze typing behavior
  private analyzeTypingBehavior(input: BehavioralInput): { type: string; severity: number; description: string } | null {
    // Check for suspiciously fast typing
    if (input.typingSpeed > this.THRESHOLDS.typingSpeedHigh) {
      return {
        type: 'SUPERHUMAN_TYPING',
        severity: 60,
        description: 'Typing speed exceeds human capabilities'
      };
    }

    // Check for suspiciously slow typing
    if (input.typingSpeed < this.THRESHOLDS.typingSpeedLow && input.pasteEvents === 0) {
      return {
        type: 'SLOW_TYPING',
        severity: 15,
        description: 'Unusually slow typing speed detected'
      };
    }

    // Check for high backspace ratio (potential copy-paste or uncertainty)
    if (input.backspaceRatio > 0.5) {
      return {
        type: 'HIGH_ERROR_RATE',
        severity: 10,
        description: 'High backspace/delete ratio suggests uncertainty or automated input'
      };
    }

    return null;
  }

  // Analyze navigation patterns
  private analyzeNavigationBehavior(
    input: BehavioralInput,
    baseline: BehavioralBaseline | null
  ): { type: string; severity: number; description: string } | null {
    // Check for very short session with multiple page views
    if (input.totalSessionDuration < this.THRESHOLDS.sessionDurationShort && input.pageViews > 10) {
      return {
        type: 'SUSPICIOUSLY_FAST_BROWSING',
        severity: 50,
        description: 'Too many pages viewed in very short time'
      };
    }

    // Check for very long session
    if (input.totalSessionDuration > this.THRESHOLDS.sessionDurationLong * 2) {
      return {
        type: 'EXTENDED_SESSION',
        severity: 15,
        description: 'Unusually long browsing session'
      };
    }

    // Check for random page sequence (bot-like)
    if (input.pagesVisited.length > 5) {
      const pattern = this.detectRandomPagePattern(input.pagesVisited);
      if (pattern) {
        return {
          type: 'RANDOM_PAGE_SEQUENCE',
          severity: 40,
          description: 'Unnatural page navigation sequence detected'
        };
      }
    }

    return null;
  }

  // Detect random page navigation pattern
  private detectRandomPagePattern(pages: string[]): boolean {
    // Simple heuristic: if pages are visited in exact alphabetical order or reverse
    const sortedAsc = [...pages].sort();
    const sortedDesc = [...pages].sort().reverse();
    const isOrdered = JSON.stringify(pages) === JSON.stringify(sortedAsc);
    const isReverseOrdered = JSON.stringify(pages) === JSON.stringify(sortedDesc);
    return isOrdered || isReverseOrdered;
  }

  // Analyze time-based behavior
  private analyzeTimeBehavior(
    input: BehavioralInput,
    baseline: BehavioralBaseline | null
  ): { type: string; severity: number; description: string } | null {
    if (!baseline) return null;

    // Check if outside typical hours
    if (input.hourOfDay < baseline.typicalHourStart || input.hourOfDay > baseline.typicalHourEnd) {
      // Check if this is unusual for the user
      const hourDeviation = Math.min(
        Math.abs(input.hourOfDay - baseline.typicalHourStart),
        Math.abs(input.hourOfDay - baseline.typicalHourEnd)
      );
      
      if (hourDeviation > 4) {
        return {
          type: 'UNUSUAL_TIME',
          severity: Math.min(30, hourDeviation * 5),
          description: `Activity during unusual hours (${input.hourOfDay}:00)`
        };
      }
    }

    return null;
  }

  // Analyze geographic consistency
  private analyzeGeographicConsistency(
    input: BehavioralInput,
    profile: any
  ): { type: string; severity: number; description: string } | null {
    if (!profile?.typicalLocations?.length) return null;

    if (!profile.typicalLocations.includes(input.country)) {
      return {
        type: 'NEW_LOCATION',
        severity: 25,
        description: `First activity from country: ${input.country}`
      };
    }

    return null;
  }

  // Analyze device consistency
  private analyzeDeviceConsistency(
    input: BehavioralInput,
    profile: any
  ): { type: string; severity: number; description: string } | null {
    if (!profile?.preferredDevice) return null;

    if (input.deviceType !== profile.preferredDevice) {
      return {
        type: 'DEVICE_CHANGE',
        severity: 20,
        description: `Activity from different device type: ${input.deviceType}`
      };
    }

    return null;
  }

  // Detect bot-like behavior
  private detectBotBehavior(input: BehavioralInput): { type: string; severity: number; description: string } | null {
    const botIndicators = [];

    // No mouse movement but page navigation
    if (input.mouseMovements === 0 && input.pageViews > 3) {
      botIndicators.push('no_mouse_movement');
    }

    // Perfectly regular timing between actions
    if (input.keystrokeTiming.length > 5) {
      const timingVariance = this.calculateVariance(input.keystrokeTiming);
      if (timingVariance === 0) {
        botIndicators.push('robotic_timing');
      }
    }

    // Extremely fast page navigation
    if (input.totalSessionDuration < 10 && input.pageViews > 10) {
      botIndicators.push('instant_page_views');
    }

    if (botIndicators.length > 0) {
      return {
        type: 'BOT_ACTIVITY',
        severity: Math.min(80, botIndicators.length * 25),
        description: `Bot-like behavior detected: ${botIndicators.join(', ')}`
      };
    }

    return null;
  }

  // Calculate variance of array
  private calculateVariance(arr: number[]): number {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const squaredDiffs = arr.map(x => Math.pow(x - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / arr.length;
  }

  // Get or create user behavior profile
  private async getOrCreateBehaviorProfile(userId: string): Promise<any> {
    try {
      let profile = await (prisma as any).behavioralProfile?.findUnique({
        where: { userId }
      });

      if (!profile) {
        profile = await (prisma as any).behavioralProfile?.create({
          data: {
            userId,
            avgSessionDuration: 300,
            avgPagesPerSession: 5,
            avgTimeToPurchase: 600,
            avgMouseSpeed: 50,
            avgTypingSpeed: 200,
            preferredDevice: 'desktop',
            typicalLocations: [],
            browsingPattern: 'NORMAL',
            currentAnomalyScore: 0,
            deviationFromNormal: 0,
            behaviorDriftScore: 0
          }
        });
      }

      return profile;
    } catch {
      return null;
    }
  }

  // Get user's baseline behavior
  private async getUserBaseline(userId: string): Promise<BehavioralBaseline | null> {
    const profile = await this.getOrCreateBehaviorProfile(userId);
    
    if (!profile) {
      return null;
    }

    return {
      avgSessionDuration: profile.avgSessionDuration,
      avgPagesPerSession: profile.avgPagesPerSession,
      avgTimeToPurchase: profile.avgTimeToPurchase,
      avgTypingSpeed: profile.avgTypingSpeed,
      avgMouseSpeed: profile.avgMouseSpeed,
      typicalHourStart: 9,
      typicalHourEnd: 22,
      preferredDevice: profile.preferredDevice,
      typicalCountries: profile.typicalLocations || [],
      browsingPattern: profile.browsingPattern
    };
  }

  // Update behavior profile with current session data
  private async updateBehaviorProfile(input: BehavioralInput): Promise<void> {
    try {
      const profile = await this.getOrCreateBehaviorProfile(input.userId);
      if (!profile) return;

      // Calculate new averages (exponential moving average)
      const alpha = 0.3; // smoothing factor
      const newAvgDuration = alpha * input.totalSessionDuration + (1 - alpha) * (profile.avgSessionDuration || 300);
      const newAvgPages = alpha * input.pageViews + (1 - alpha) * (profile.avgPagesPerSession || 5);
      const newAvgMouseSpeed = alpha * input.mouseSpeed + (1 - alpha) * (profile.avgMouseSpeed || 50);
      const newAvgTypingSpeed = alpha * input.typingSpeed + (1 - alpha) * (profile.avgTypingSpeed || 200);

      // Update locations
      const locations = new Set([...(profile.typicalLocations || []), input.country]);
      const locationArray = Array.from(locations).slice(-10); // Keep last 10

      await (prisma as any).behavioralProfile?.update({
        where: { userId: input.userId },
        data: {
          avgSessionDuration: newAvgDuration,
          avgPagesPerSession: newAvgPages,
          avgMouseSpeed: newAvgMouseSpeed,
          avgTypingSpeed: newAvgTypingSpeed,
          typicalLocations: locationArray,
          currentAnomalyScore: 0,
          lastAnalyzedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating behavior profile:', error);
    }
  }

  // Calculate deviation score from baseline
  private calculateDeviationScore(
    input: BehavioralInput,
    baseline: BehavioralBaseline | null,
    profile: any
  ): number {
    if (!baseline) return 50; // Default medium deviation for new users

    let deviation = 0;

    // Session duration deviation
    const durationRatio = Math.abs(input.totalSessionDuration - baseline.avgSessionDuration) / baseline.avgSessionDuration;
    deviation += Math.min(30, durationRatio * 20);

    // Pages deviation
    const pagesRatio = Math.abs(input.pageViews - baseline.avgPagesPerSession) / baseline.avgPagesPerSession;
    deviation += Math.min(20, pagesRatio * 15);

    // Mouse speed deviation
    const mouseRatio = Math.abs(input.mouseSpeed - baseline.avgMouseSpeed) / baseline.avgMouseSpeed;
    deviation += Math.min(20, mouseRatio * 10);

    return Math.min(100, deviation);
  }

  // Determine risk level
  private determineRiskLevel(anomalyScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (anomalyScore < 30) return 'LOW';
    if (anomalyScore < 60) return 'MEDIUM';
    if (anomalyScore < 85) return 'HIGH';
    return 'CRITICAL';
  }

  // Generate recommendations based on detected anomalies
  private generateRecommendations(
    anomalies: { type: string; severity: number; description: string }[],
    totalScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (totalScore > 70) {
      recommendations.push('Require additional verification before completing transaction');
      recommendations.push('Flag account for manual review');
    } else if (totalScore > 40) {
      recommendations.push('Consider implementing step-up authentication');
      recommendations.push('Monitor this session more closely');
    }

    for (const anomaly of anomalies) {
      switch (anomaly.type) {
        case 'BOT_ACTIVITY':
          recommendations.push('Implement CAPTCHA verification');
          break;
        case 'ROBOTIC_MOUSE':
          recommendations.push('Consider requiring biometric verification');
          break;
        case 'SUSPICIOUSLY_FAST_BROWSING':
          recommendations.push('Add rate limiting for this session');
          break;
        case 'NEW_LOCATION':
          recommendations.push('Send location verification email');
          break;
      }
    }

    return [...new Set(recommendations)];
  }

  // Get behavior profile for user
  async getBehaviorProfile(userId: string): Promise<any> {
    return this.getOrCreateBehaviorProfile(userId);
  }

  // Reset behavior profile
  async resetBehaviorProfile(userId: string): Promise<boolean> {
    try {
      await (prisma as any).behavioralProfile?.delete({
        where: { userId }
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const behavioralAnalysisService = new BehavioralAnalysisService();
