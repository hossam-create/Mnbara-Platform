// Prediction Service - AI Delivery Time Prediction
// خدمة التنبؤ - توقع وقت التوصيل بالذكاء الاصطناعي

import { PrismaClient } from '@prisma/client';
import * as geolib from 'geolib';

const prisma = new PrismaClient();

interface Location {
  lat: number;
  lng: number;
}

interface PredictionFactors {
  distance: number;
  traffic: number;
  weather: number;
  timeOfDay: number;
  dayOfWeek: number;
  travelerPerformance: number;
}

interface DeliveryPrediction {
  estimatedDuration: number; // minutes
  estimatedArrival: Date;
  confidence: number; // 0-100
  factors: PredictionFactors;
}

export class PredictionService {
  // Base speeds for different conditions (km/h)
  private readonly BASE_SPEED = 30;
  private readonly TRAFFIC_MULTIPLIERS = {
    low: 1.2,
    medium: 1.0,
    high: 0.6,
    severe: 0.3
  };
  private readonly WEATHER_MULTIPLIERS = {
    clear: 1.0,
    cloudy: 0.95,
    rain: 0.7,
    heavy_rain: 0.5,
    storm: 0.3
  };

  // ==========================================
  // 🔮 DELIVERY PREDICTION
  // ==========================================

  // Predict delivery time
  async predictDeliveryTime(
    pickupLocation: Location,
    dropoffLocation: Location,
    travelerId?: string
  ): Promise<DeliveryPrediction> {
    // Calculate distance
    const distance = geolib.getDistance(
      { latitude: pickupLocation.lat, longitude: pickupLocation.lng },
      { latitude: dropoffLocation.lat, longitude: dropoffLocation.lng }
    ) / 1000; // km

    // Get current factors
    const factors = await this.getFactors(pickupLocation, travelerId);

    // Calculate effective speed
    const effectiveSpeed = this.calculateEffectiveSpeed(factors);

    // Calculate duration
    const baseDuration = (distance / effectiveSpeed) * 60; // minutes
    
    // Add buffer for pickup/dropoff (5 min each)
    const totalDuration = baseDuration + 10;

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(factors);

    // Calculate estimated arrival
    const estimatedArrival = new Date();
    estimatedArrival.setMinutes(estimatedArrival.getMinutes() + totalDuration);

    return {
      estimatedDuration: Math.round(totalDuration),
      estimatedArrival,
      confidence,
      factors: {
        ...factors,
        distance
      }
    };
  }

  // Get prediction factors
  private async getFactors(location: Location, travelerId?: string): Promise<Omit<PredictionFactors, 'distance'>> {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Get traffic data (mock - would use real API)
    const traffic = await this.getTrafficLevel(location);

    // Get weather data (mock - would use real API)
    const weather = await this.getWeatherImpact(location);

    // Time of day factor (rush hours are slower)
    const timeOfDay = this.getTimeOfDayFactor(hour);

    // Day of week factor (weekends are faster)
    const dayFactor = this.getDayOfWeekFactor(dayOfWeek);

    // Traveler performance
    let travelerPerformance = 1.0;
    if (travelerId) {
      const performance = await prisma.travelerPerformance.findUnique({
        where: { travelerId }
      });
      if (performance && performance.avgDeliveryTime) {
        // Adjust based on historical performance
        travelerPerformance = performance.onTimeRate ? performance.onTimeRate / 100 : 1.0;
      }
    }

    return {
      traffic,
      weather,
      timeOfDay,
      dayOfWeek: dayFactor,
      travelerPerformance
    };
  }

  // Calculate effective speed based on factors
  private calculateEffectiveSpeed(factors: Omit<PredictionFactors, 'distance'>): number {
    let speed = this.BASE_SPEED;

    // Apply traffic factor
    speed *= factors.traffic;

    // Apply weather factor
    speed *= factors.weather;

    // Apply time of day factor
    speed *= factors.timeOfDay;

    // Apply day of week factor
    speed *= factors.dayOfWeek;

    // Apply traveler performance
    speed *= factors.travelerPerformance;

    // Minimum speed of 5 km/h
    return Math.max(5, speed);
  }

  // Get traffic level (0-1, where 1 is best)
  private async getTrafficLevel(location: Location): Promise<number> {
    // In production, this would call Google Maps Traffic API
    const hour = new Date().getHours();
    
    // Rush hours: 7-9 AM and 5-7 PM
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return 0.6; // High traffic
    } else if (hour >= 10 && hour <= 16) {
      return 0.85; // Medium traffic
    } else {
      return 1.0; // Low traffic
    }
  }

  // Get weather impact (0-1, where 1 is best)
  private async getWeatherImpact(location: Location): Promise<number> {
    // In production, this would call Weather API
    // For now, return good weather
    return 0.95;
  }

  // Time of day factor
  private getTimeOfDayFactor(hour: number): number {
    if (hour >= 22 || hour <= 5) return 1.1; // Night - faster
    if (hour >= 7 && hour <= 9) return 0.7; // Morning rush
    if (hour >= 17 && hour <= 19) return 0.7; // Evening rush
    return 0.9; // Normal
  }

  // Day of week factor
  private getDayOfWeekFactor(day: number): number {
    if (day === 0 || day === 6) return 1.1; // Weekend - faster
    if (day === 5) return 0.85; // Friday - slower
    return 1.0; // Weekday
  }

  // Calculate confidence
  private calculateConfidence(factors: Omit<PredictionFactors, 'distance'>): number {
    // Base confidence
    let confidence = 70;

    // Adjust based on data quality
    if (factors.traffic > 0.8) confidence += 10;
    if (factors.weather > 0.8) confidence += 10;
    if (factors.travelerPerformance > 0.9) confidence += 10;

    return Math.min(95, confidence);
  }

  // ==========================================
  // 📊 PREDICTION ANALYTICS
  // ==========================================

  // Save prediction
  async savePrediction(
    deliveryId: string,
    prediction: DeliveryPrediction
  ): Promise<any> {
    return prisma.deliveryPrediction.create({
      data: {
        deliveryId,
        predictedDuration: prediction.estimatedDuration,
        predictedArrival: prediction.estimatedArrival,
        confidence: prediction.confidence,
        factors: prediction.factors
      }
    });
  }

  // Update prediction accuracy
  async updatePredictionAccuracy(
    predictionId: string,
    actualDuration: number
  ): Promise<void> {
    const prediction = await prisma.deliveryPrediction.findUnique({
      where: { id: predictionId }
    });

    if (prediction) {
      const accuracy = 100 - Math.abs(
        ((actualDuration - prediction.predictedDuration) / prediction.predictedDuration) * 100
      );

      await prisma.deliveryPrediction.update({
        where: { id: predictionId },
        data: {
          actualDuration,
          accuracy: Math.max(0, accuracy)
        }
      });
    }
  }

  // Get prediction accuracy stats
  async getPredictionAccuracyStats(): Promise<{
    avgAccuracy: number;
    totalPredictions: number;
    accuracyByConfidence: Record<string, number>;
  }> {
    const predictions = await prisma.deliveryPrediction.findMany({
      where: { accuracy: { not: null } }
    });

    if (predictions.length === 0) {
      return {
        avgAccuracy: 0,
        totalPredictions: 0,
        accuracyByConfidence: {}
      };
    }

    const avgAccuracy = predictions.reduce((sum, p) => sum + (p.accuracy || 0), 0) / predictions.length;

    // Group by confidence level
    const accuracyByConfidence: Record<string, { sum: number; count: number }> = {};
    for (const p of predictions) {
      const confidenceLevel = p.confidence >= 80 ? 'high' : p.confidence >= 60 ? 'medium' : 'low';
      if (!accuracyByConfidence[confidenceLevel]) {
        accuracyByConfidence[confidenceLevel] = { sum: 0, count: 0 };
      }
      accuracyByConfidence[confidenceLevel].sum += p.accuracy || 0;
      accuracyByConfidence[confidenceLevel].count++;
    }

    const accuracyByConfidenceResult: Record<string, number> = {};
    for (const [level, data] of Object.entries(accuracyByConfidence)) {
      accuracyByConfidenceResult[level] = data.sum / data.count;
    }

    return {
      avgAccuracy,
      totalPredictions: predictions.length,
      accuracyByConfidence: accuracyByConfidenceResult
    };
  }
}

export const predictionService = new PredictionService();
