/**
 * Data & Information Service
 * Weather, Geocoding, Currency information
 */

import { BaseApiClient } from './base-client';
import { config } from './config';
import { ApiResponse, WeatherData, GeoLocation } from './types';

export class WeatherService extends BaseApiClient {
  constructor() {
    const weatherConfig = config.getServiceConfig('weather');
    
    if (!weatherConfig) {
      throw new Error('Weather service not configured');
    }

    super('weather', weatherConfig);
  }

  async getCurrentWeather(location: GeoLocation): Promise<ApiResponse<WeatherData>> {
    const cacheKey = `weather:${location.latitude},${location.longitude}`;
    
    const response = await this.get<any>(
      '/weather',
      {
        lat: location.latitude,
        lon: location.longitude,
        appid: this.config.apiKey,
        units: 'metric',
      },
      cacheKey
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: {
          temperature: response.data.main.temp,
          humidity: response.data.main.humidity,
          condition: response.data.weather[0].description,
          windSpeed: response.data.wind.speed,
          location,
          timestamp: new Date(),
        },
        cached: response.cached,
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<WeatherData>;
  }

  async getForecast(location: GeoLocation, days: number = 5): Promise<ApiResponse<WeatherData[]>> {
    const cacheKey = `forecast:${location.latitude},${location.longitude}:${days}`;
    
    const response = await this.get<any>(
      '/forecast',
      {
        lat: location.latitude,
        lon: location.longitude,
        appid: this.config.apiKey,
        units: 'metric',
        cnt: days * 8, // 8 forecasts per day (3-hour intervals)
      },
      cacheKey
    );

    if (response.success && response.data?.list) {
      const forecasts: WeatherData[] = response.data.list.map((item: any) => ({
        temperature: item.main.temp,
        humidity: item.main.humidity,
        condition: item.weather[0].description,
        windSpeed: item.wind.speed,
        location,
        timestamp: new Date(item.dt * 1000),
      }));

      return {
        success: true,
        data: forecasts,
        cached: response.cached,
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<WeatherData[]>;
  }
}
