import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TravelerMatch {
  travelerId: number;
  travelerName: string;
  travelerEmail: string;
  totalScore: number; // 0-100
  scoreBreakdown: {
    sourceCountryMatch: number; // 0-20
    destinationCountryMatch: number; // 0-20
    dateProximity: number; // 0-30
    trustScore: number; // 0-30
  };
  bestAvailability?: {
    origin: string;
    destination: string;
    departTime: Date;
    arriveTime: Date;
  };
}

export interface MatchingConfig {
  topN?: number; // Default 5
  countryMatchWeight?: number; // Default 40 (20+20)
  dateProximityWeight?: number; // Default 30
  trustScoreWeight?: number; // Default 30
  maxDateProximityDays?: number; // Default 30 days
}

export class MatchingService {
  private defaultConfig: Required<MatchingConfig> = {
    topN: 5,
    countryMatchWeight: 40,
    dateProximityWeight: 30,
    trustScoreWeight: 30,
    maxDateProximityDays: 30,
  };

  /**
   * Get suggested travelers for a shopper request
   * Deterministic scoring based on country match, date proximity, and trust score
   */
  async getSuggestedTravelers(
    requestId: number,
    config?: MatchingConfig,
  ): Promise<TravelerMatch[]> {
    const request = await prisma.shopperRequest.findUnique({
      where: { id: requestId },
      include: {
        buyer: true,
        offers: {
          select: { travelerId: true }, // Exclude travelers who already made offers
        },
      },
    });

    if (!request) {
      throw new Error(`ShopperRequest ${requestId} not found`);
    }

    if (!request.sourceCountry || !request.destinationCountry) {
      throw new Error('Request must have both sourceCountry and destinationCountry for matching');
    }

    const cfg = { ...this.defaultConfig, ...config };
    const excludeTravelerIds = new Set(request.offers.map((o) => o.travelerId));

    // Find all travelers with TRAVELER role
    const travelers = await prisma.user.findMany({
      where: {
        role: 'TRAVELER',
        id: { notIn: Array.from(excludeTravelerIds) },
      },
      include: {
        travelerLocation: true,
        travelerAvailability: {
          where: { isActive: true },
        },
      },
    });

    const matches: TravelerMatch[] = [];

    for (const traveler of travelers) {
      const score = this.calculateMatchScore(traveler, request, cfg);
      if (score.totalScore > 0) {
        matches.push(score);
      }
    }

    // Sort by total score (descending) - deterministic
    matches.sort((a, b) => b.totalScore - a.totalScore);

    // Return top N
    return matches.slice(0, cfg.topN);
  }

  /**
   * Calculate match score for a traveler against a request
   * Deterministic: same inputs → same score
   */
  private calculateMatchScore(
    traveler: any,
    request: any,
    config: Required<MatchingConfig>,
  ): TravelerMatch {
    const breakdown = {
      sourceCountryMatch: 0,
      destinationCountryMatch: 0,
      dateProximity: 0,
      trustScore: 0,
    };

    let bestAvailability: any = null;
    let bestDateScore = 0;

    // 1. Source Country Match (0-20 points)
    // Check if traveler is in source country OR has availability from source country
    const sourceMatch = this.checkSourceCountryMatch(traveler, request.sourceCountry);
    breakdown.sourceCountryMatch = sourceMatch ? 20 : 0;

    // 2. Destination Country Match (0-20 points)
    // Check if traveler has availability to destination country
    const destMatch = this.checkDestinationCountryMatch(traveler, request.destinationCountry);
    breakdown.destinationCountryMatch = destMatch ? 20 : 0;

    // 3. Date Proximity (0-30 points)
    // Find best matching availability by date proximity
    if (traveler.travelerAvailability && traveler.travelerAvailability.length > 0) {
      for (const avail of traveler.travelerAvailability) {
        // Check if this availability matches source → destination
        const originMatch = this.normalizeCountry(avail.origin) === this.normalizeCountry(request.sourceCountry);
        const destMatch = this.normalizeCountry(avail.destination) === this.normalizeCountry(request.destinationCountry);

        if (originMatch && destMatch) {
          // Calculate date proximity score
          const daysDiff = this.calculateDaysDifference(avail.departTime, new Date());
          if (daysDiff >= 0 && daysDiff <= config.maxDateProximityDays) {
            // Closer dates = higher score
            // Score = 30 * (1 - daysDiff / maxDays)
            const dateScore = Math.max(0, 30 * (1 - daysDiff / config.maxDateProximityDays));
            if (dateScore > bestDateScore) {
              bestDateScore = dateScore;
              bestAvailability = avail;
            }
          }
        }
      }
    }
    breakdown.dateProximity = bestDateScore;

    // 4. Trust Score (0-30 points)
    // Normalize rating (0-5) to (0-30)
    const rating = traveler.rating ? Number(traveler.rating) : 0;
    breakdown.trustScore = Math.min(30, (rating / 5) * 30);

    const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    return {
      travelerId: traveler.id,
      travelerName: `${traveler.firstName} ${traveler.lastName}`,
      travelerEmail: traveler.email,
      totalScore: Math.round(totalScore * 100) / 100, // Round to 2 decimals
      scoreBreakdown: breakdown,
      bestAvailability: bestAvailability
        ? {
            origin: bestAvailability.origin,
            destination: bestAvailability.destination,
            departTime: bestAvailability.departTime,
            arriveTime: bestAvailability.arriveTime,
          }
        : undefined,
    };
  }

  /**
   * Check if traveler matches source country
   */
  private checkSourceCountryMatch(traveler: any, sourceCountry: string): boolean {
    const normalizedSource = this.normalizeCountry(sourceCountry);

    // Check traveler's current location
    if (traveler.travelerLocation?.country) {
      if (this.normalizeCountry(traveler.travelerLocation.country) === normalizedSource) {
        return true;
      }
    }

    // Check traveler's availability origins
    if (traveler.travelerAvailability) {
      for (const avail of traveler.travelerAvailability) {
        if (this.normalizeCountry(avail.origin) === normalizedSource) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if traveler has availability to destination country
   */
  private checkDestinationCountryMatch(traveler: any, destinationCountry: string): boolean {
    const normalizedDest = this.normalizeCountry(destinationCountry);

    if (traveler.travelerAvailability) {
      for (const avail of traveler.travelerAvailability) {
        if (this.normalizeCountry(avail.destination) === normalizedDest) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Normalize country name for comparison (case-insensitive, trim)
   */
  private normalizeCountry(country: string | null | undefined): string {
    if (!country) return '';
    return country.trim().toLowerCase();
  }

  /**
   * Calculate days difference between two dates (absolute)
   */
  private calculateDaysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date1.getTime() - date2.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}





