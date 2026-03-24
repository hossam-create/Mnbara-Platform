/**
 * External APIs Configuration for Integration Tests
 * Sourced from: https://github.com/public-apis/public-apis
 * 
 * This file contains public APIs that can be used for integration testing
 * of the @mnbara/api-client package.
 * 
 * Selection Criteria:
 * - Free tier available
 * - HTTPS support
 * - CORS enabled (or permissive)
 * - No authentication required (or free tier)
 * - Stable and reliable
 */

// ============================================================================
// CATEGORY: TEST DATA
// Useful for generating mock data in tests
// ============================================================================

export const TEST_DATA_APIS = {
  name: 'Test Data APIs',
  description: 'APIs for generating test data (users, products, etc.)',
  apis: [
    {
      name: 'JSONPlaceholder',
      baseURL: 'https://jsonplaceholder.typicode.com',
      description: 'Fake data for testing and prototyping',
      endpoints: {
        posts: '/posts',
        users: '/users',
        comments: '/comments',
        albums: '/albums',
        photos: '/photos',
        todos: '/todos',
      },
      features: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      cors: true,
      auth: false,
      rateLimit: 'Unknown',
      documentation: 'https://jsonplaceholder.typicode.com/',
    },
    {
      name: 'RandomUser',
      baseURL: 'https://randomuser.me/api',
      description: 'Generates and lists user data',
      endpoints: {
        getUser: '/',
        getUsers: '/?results=10',
      },
      features: ['GET'],
      cors: true,
      auth: false,
      rateLimit: 'Unknown',
      documentation: 'https://randomuser.me/',
    },
    {
      name: 'FakeStoreAPI',
      baseURL: 'https://fakestoreapi.com',
      description: 'Fake store REST API for e-commerce or shopping website prototype',
      endpoints: {
        products: '/products',
        product: '/products/{id}',
        categories: '/products/categories',
        categoryProducts: '/products/category/{category}',
        carts: '/carts',
        cart: '/carts/{id}',
        users: '/users',
        login: '/auth/login',
      },
      features: ['GET', 'POST', 'PUT', 'DELETE'],
      cors: true,
      auth: false,
      rateLimit: 'Unknown',
      documentation: 'https://fakestoreapi.com/',
    },
    {
      name: 'Mockaroo',
      baseURL: 'https://my.api.mockaroo.com',
      description: 'Generate fake data to JSON, CSV, TXT, SQL and XML',
      endpoints: {
        generate: '/generate',
      },
      features: ['GET', 'POST'],
      cors: true,
      auth: 'apiKey',
      rateLimit: '300 requests/day (free tier)',
      documentation: 'https://www.mockaroo.com/',
    },
    {
      name: 'FakerAPI',
      baseURL: 'https://fakerapi.it/api/v1',
      description: 'APIs collection to get fake data',
      endpoints: {
        address: '/address',
        books: '/books',
        cars: '/cars',
        creditCard: '/credit_cards',
        dates: '/dates',
        emails: '/emails',
        images: '/images',
        names: '/names',
        phones: '/phones',
        users: '/users',
      },
      features: ['GET'],
      cors: true,
      auth: false,
      rateLimit: 'Unknown',
      documentation: 'https://fakerapi.it/',
    },
  ],
};

// ============================================================================
// CATEGORY: WEATHER
// Useful for testing external API calls with real-time data
// ============================================================================

export const WEATHER_APIS = {
  name: 'Weather APIs',
  description: 'APIs for weather data - useful for testing real-time data fetching',
  apis: [
    {
      name: 'Open-Meteo',
      baseURL: 'https://api.open-meteo.com',
      description: 'Global weather forecast API for non-commercial use',
      endpoints: {
        forecast: '/v1/forecast',
        historical: '/v1/archive',
      },
      features: ['GET'],
      cors: true,
      auth: false,
      rateLimit: 'Free for non-commercial',
      documentation: 'https://open-meteo.com/',
    },
    {
      name: 'WeatherAPI',
      baseURL: 'https://api.weatherapi.com',
      description: 'Weather API with other stuff like Astronomy and Geolocation API',
      endpoints: {
        current: '/v1/current.json',
        forecast: '/v1/forecast.json',
        search: '/v1/search.json',
        astronomy: '/v1/astronomy.json',
        timezone: '/v1/timezone.json',
        sports: '/v1/sports.json',
      },
      features: ['GET'],
      cors: true,
      auth: 'apiKey',
      rateLimit: '1M calls/month (free tier)',
      documentation: 'https://www.weatherapi.com/',
    },
    {
      name: 'MetaWeather',
      baseURL: 'https://metaweather.com/api',
      description: 'Weather API',
      endpoints: {
        location: '/location/{woeid}',
        search: '/location/search',
      },
      features: ['GET'],
      cors: true,
      auth: false,
      rateLimit: 'Unknown',
      documentation: 'https://www.metaweather.com/api/',
    },
  ],
};

// ============================================================================
// CATEGORY: CURRENCY EXCHANGE
// Useful for testing financial data APIs
// ============================================================================

export const CURRENCY_APIS = {
  name: 'Currency Exchange APIs',
  description: 'APIs for currency exchange rates - useful for testing financial data',
  apis: [
    {
      name: 'Frankfurter',
      baseURL: 'https://api.frankfurter.app',
      description: 'Exchange rates, currency conversion and time series',
      endpoints: {
        latest: '/latest',
        historical: '/{date}',
        convert: '/convert',
        timeSeries: '/{start}/{end}',
      },
      features: ['GET'],
      cors: true,
      auth: false,
      rateLimit: 'Unknown',
      documentation: 'https://www.frankfurter.app/',
    },
    {
      name: 'ExchangeRate-API',
      baseURL: 'https://v6.exchangerate-api.com',
      description: 'Free currency conversion',
      endpoints: {
        list: '/v6/{apiKey}/codes',
        pair: '/v6/{apiKey}/pair/{from}/{to}',
        latest: '/v6/{apiKey}/latest/{base}',
      },
      features: ['GET'],
      cors: true,
      auth: 'apiKey',
      rateLimit: '1,500 requests/month (free tier)',
      documentation: 'https://www.exchangerate-api.com/',
    },
    {
      name: 'Exchangerate.host',
      baseURL: 'https://api.exchangerate.host',
      description: 'Free foreign exchange & crypto rates API',
      endpoints: {
        latest: '/latest',
        historical: '/{date}',
        convert: '/convert',
        timeSeries: '/timeseries',
        fluctuation: '/fluctuation',
      },
      features: ['GET'],
      cors: true,
      auth: false,
      rateLimit: 'Unknown',
      documentation: 'https://exchangerate.host/',
    },
  ],
};

// ============================================================================
// CATEGORY: GEOCODING
// Useful for testing location-based services
// ============================================================================

export const GEOCODING_APIS = {
  name: 'Geocoding APIs',
  description: 'APIs for geolocation and address services',
  apis: [
    {
      name: 'REST Countries',
      baseURL: 'https://restcountries.com',
      description: 'Get information about countries via a RESTful API',
      endpoints: {
        all: '/v3.1/all',
        name: '/v3.1/name/{name}',
        code: '/v3.1/alpha/{code}',
        currency: '/v3.1/currency/{currency}',
        language: '/v3.1/lang/{lang}',
        capital: '/v3.1/capital/{capital}',
        region: '/v3.1/region/{region}',
      },
      features: ['GET'],
      cors: true,
      auth: false,
      rateLimit: 'Unknown',
      documentation: 'https://restcountries.com/',
    },
    {
      name: 'ipapi.co',
      baseURL: 'https://ipapi.co/json',
      description: 'Find IP address location information',
      endpoints: {
        myIP: '/json',
        lookup: '/json/{ip}',
      },
      features: ['GET'],
      cors: true,
      auth: false,
      rateLimit: '1,000 requests/day (free tier)',
      documentation: 'https://ipapi.co/',
    },
    {
      name: 'CountryStateCity',
      baseURL: 'https://countriesnow.space/api/v0.1/countries',
      description: 'World countries, states, regions, provinces, cities & towns',
      endpoints: {
        codes: '/codes',
        cities: '/cities',
        positions: '/positions',
        population: '/population',
        flag: '/flag/images',
        citiesByCountry: '/cities/{country}',
      },
      features: ['GET', 'POST'],
      cors: true,
      auth: false,
      rateLimit: 'Unknown',
      documentation: 'https://countriesnow.space/',
    },
  ],
};

// ============================================================================
// CATEGORY: NEWS
// Useful for testing RSS/News feed parsing
// ============================================================================

export const NEWS_APIS = {
  name: 'News APIs',
  description: 'APIs for news and blog articles',
  apis: [
    {
      name: 'NewsData',
      baseURL: 'https://newsdata.io/api/1',
      description: 'News data API for live-breaking news and headlines',
      endpoints: {
        latest: '/news',
        category: '/news?category={category}',
        country: '/news?country={country}',
      },
      features: ['GET'],
      cors: true,
      auth: 'apiKey',
      rateLimit: '600 requests/day (free tier)',
      documentation: 'https://newsdata.io/',
    },
    {
      name: 'GNews',
      baseURL: 'https://gnews.io/api/v4',
      description: 'Search for news from various sources',
      endpoints: {
        search: '/search',
        topHeadlines: '/top-headlines',
      },
      features: ['GET'],
      cors: true,
      auth: 'apiKey',
      rateLimit: '100 requests/day (free tier)',
      documentation: 'https://gnews.io/',
    },
    {
      name: 'TheNews',
      baseURL: 'https://api.thenewsapi.com/v1',
      description: 'Aggregated headlines, top story and live news JSON API',
      endpoints: {
        top: '/news/top',
        all: '/news/all',
        search: '/news/search',
      },
      features: ['GET'],
      cors: true,
      auth: 'apiKey',
      rateLimit: 'Unknown',
      documentation: 'https://thenewsapi.com/',
    },
  ],
};

// ============================================================================
// CATEGORY: ANIMALS
// Useful for testing image/media APIs
// ============================================================================

export const ANIMAL_APIS = {
  name: 'Animal APIs',
  description: 'APIs for animal images and facts - useful for testing media handling',
  apis: [
    {
      name: 'Dog CEO',
      baseURL: 'https://dog.ceo/api',
      description: 'A public service all about Dogs, free to use',
      endpoints: {
        breeds: '/breeds/list/all',
        randomImage: '/breeds/image/random',
        byBreed: '/breeds/image/random/{breed}',
        subBreedImages: '/breed/{breed}/images',
      },
      features: ['GET'],
      cors: true,
      auth: false,
      rateLimit: 'Unknown',
      documentation: 'https://dog.ceo/',
    },
    {
      name: 'The Cat API',
      baseURL: 'https://api.thecatapi.com/v1',
      description: 'Cat pictures, facts and more',
      endpoints: {
        images: '/images',
        breeds: '/breeds',
        categories: '/categories',
        search: '/images/search',
        favorites: '/favourites',
        votes: '/votes',
      },
      features: ['GET', 'POST', 'DELETE'],
      cors: true,
      auth: 'apiKey',
      rateLimit: 'Unknown',
      documentation: 'https://thecatapi.com/',
    },
    {
      name: 'RandomFox',
      baseURL: 'https://randomfox.ca/floof',
      description: 'Random pictures of foxes',
      endpoints: {
        random: '/floof',
      },
      features: ['GET'],
      cors: true,
      auth: false,
      rateLimit: 'Unknown',
      documentation: 'https://randomfox.ca/',
    },
  ],
};

// ============================================================================
// CATEGORY: QUOTES & FACTS
// Useful for testing text/content APIs
// ============================================================================

export const CONTENT_APIS = {
  name: 'Content APIs',
  description: 'APIs for quotes, jokes, and facts',
  apis: [
    {
      name: 'Zen Quotes',
      baseURL: 'https://zenquotes.io/api',
      description: 'Large collection of Zen quotes for inspiration',
      endpoints: {
        random: '/random',
        today: '/today',
        list: '/quotes',
      },
      features: ['GET'],
      cors: true,
      auth: false,
      rateLimit: 'Unknown',
      documentation: 'https://zenquotes.io/',
    },
    {
      name: 'icanhazdadjoke',
      baseURL: 'https://icanhazdadjoke.com',
      description: 'The largest selection of dad jokes on the internet',
      endpoints: {
        random: '/random',
        search: '/search',
        today: '/jokes/dad/available',
      },
      features: ['GET'],
      cors: true,
      auth: false,
      rateLimit: 'Unknown',
      documentation: 'https://icanhazdadjoke.com/',
    },
    {
      name: 'Useless Facts',
      baseURL: 'https://uselessfacts.jsph.pl',
      description: 'Get useless, but true facts',
      endpoints: {
        random: '/api/v2/facts/random',
        today: '/api/v2/facts/today',
        search: '/api/v2/facts',
      },
      features: ['GET'],
      cors: true,
      auth: false,
      rateLimit: 'Unknown',
      documentation: 'https://uselessfacts.jsph.pl/',
    },
  ],
};

// ============================================================================
// CATEGORY: DEVELOPMENT
// Useful for testing HTTP utilities and development tools
// ============================================================================

export const DEV_TOOLS_APIS = {
  name: 'Development Tools APIs',
  description: 'APIs useful for testing and development',
  apis: [
    {
      name: 'Httpbin',
      baseURL: 'https://httpbin.org',
      description: 'A Simple HTTP Request & Response Service',
      endpoints: {
        get: '/get',
        post: '/post',
        put: '/put',
        patch: '/patch',
        delete: '/delete',
        status: '/status/{code}',
        headers: '/headers',
        ip: '/ip',
        userAgent: '/user-agent',
        encoding: '/encoding/{charset}',
        html: '/html',
        json: '/json',
        xml: '/xml',
        redirect: '/redirect-to?url={url}',
        cookies: '/cookies',
        basicAuth: '/basic-auth/{user}/{passwd}',
        bearer: '/bearer',
        drip: '/drip?numbytes={num}&duration={duration}',
        stream: '/stream/{num}',
        delay: '/delay/{delay}',
      },
      features: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      cors: true,
      auth: false,
      rateLimit: 'Unknown',
      documentation: 'https://httpbin.org/',
    },
    {
      name: 'ReqRes',
      baseURL: 'https://reqres.in/api',
      description: 'A hosted REST-API ready to respond to your AJAX requests',
      endpoints: {
        users: '/users',
        user: '/users/{id}',
        create: '/users',
        update: '/users/{id}',
        delete: '/users/{id}',
        register: '/register',
        login: '/login',
        delay: '/users?delay={delay}',
      },
      features: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      cors: true,
      auth: false,
      rateLimit: 'Unknown',
      documentation: 'https://reqres.in/',
    },
    {
      name: 'Bored',
      baseURL: 'https://bored-api.appbrewery.com',
      description: 'Find random activities to fight boredom',
      endpoints: {
        random: '/random',
        type: '/type/{type}',
        participants: '/participants/{participants}',
        key: '/key/{key}',
      },
      features: ['GET'],
      cors: true,
      auth: false,
      rateLimit: 'Unknown',
      documentation: 'https://bored-api.appbrewery.com/',
    },
  ],
};

// ============================================================================
// CATEGORY: CRYPTOCURRENCY
// Useful for testing financial/crypto data
// ============================================================================

export const CRYPTO_APIS = {
  name: 'Cryptocurrency APIs',
  description: 'APIs for cryptocurrency data',
  apis: [
    {
      name: 'CoinGecko',
      baseURL: 'https://api.coingecko.com/api/v3',
      description: 'Cryptocurrency Price, Market, and Developer/Social Data',
      endpoints: {
        ping: '/ping',
        search: '/search',
        coins: '/coins',
        coin: '/coins/{id}',
        coinMarket: '/coins/{id}/market_chart',
        coinTicker: '/coins/{id}/ticker',
        global: '/global',
        trending: '/search/trending',
      },
      features: ['GET'],
      cors: true,
      auth: false,
      rateLimit: '10-50 calls/minute (free tier)',
      documentation: 'https://www.coingecko.com/',
    },
    {
      name: 'CoinCap',
      baseURL: 'https://api.coincap.io/v2',
      description: 'Real time Cryptocurrency prices through a RESTful API',
      endpoints: {
        assets: '/assets',
        asset: '/assets/{id}',
        assetHistory: '/assets/{id}/history',
        assetMarkets: '/assets/{id}/markets',
        rates: '/rates',
        rate: '/rates/{id}',
        exchanges: '/exchanges',
        markets: '/markets',
      },
      features: ['GET'],
      cors: true,
      auth: false,
      rateLimit: 'Unknown',
      documentation: 'https://docs.coincap.io/',
    },
  ],
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * All API categories combined
 */
export const EXTERNAL_APIS = {
  testData: TEST_DATA_APIS,
  weather: WEATHER_APIS,
  currency: CURRENCY_APIS,
  geocoding: GEOCODING_APIS,
  news: NEWS_APIS,
  animals: ANIMAL_APIS,
  content: CONTENT_APIS,
  devTools: DEV_TOOLS_APIS,
  crypto: CRYPTO_APIS,
};

/**
 * Get all APIs as a flat array for easy iteration
 */
export function getAllApis() {
  const allApis = [];
  
  for (const category of Object.values(EXTERNAL_APIS)) {
    for (const api of category.apis) {
      allApis.push({
        ...api,
        category: category.name,
        categoryDescription: category.description,
      });
    }
  }
  
  return allApis;
}

/**
 * Get APIs by feature support
 */
export function getApisByFeature(feature: string) {
  return getAllApis().filter(api => 
    api.features.includes(feature.toUpperCase())
  );
}

/**
 * Get APIs that don't require authentication
 */
export function getPublicApis() {
  return getAllApis().filter(api => !api.auth);
}

/**
 * Get APIs with CORS enabled
 */
export function getCorsEnabledApis() {
  return getAllApis().filter(api => api.cors);
}

/**
 * Get recommended APIs for integration testing
 * (Public, CORS enabled, no auth required)
 */
export function getRecommendedTestApis() {
  return getAllApis().filter(api => 
    !api.auth && api.cors
  );
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/**
 * Example: How to use these APIs in tests
 * 
 * ```typescript
 * import { EXTERNAL_APIS, getRecommendedTestApis } from './external-apis.config';
 * import { ApiClient } from '../api-client';
 * 
 * describe('External API Integration Tests', () => {
 *   const client = new ApiClient({
 *     baseURL: EXTERNAL_APIS.testData.apis[0].baseURL,
 *   });
 * 
 *   it('should fetch users from JSONPlaceholder', async () => {
 *     const response = await client.get('/users');
 *     expect(response).toBeDefined();
 *     expect(Array.isArray(response)).toBe(true);
 *   });
 * 
 *   it('should fetch weather from Open-Meteo', async () => {
 *     const weatherClient = new ApiClient({
 *       baseURL: EXTERNAL_APIS.weather.apis[0].baseURL,
 *     });
 *     const response = await weatherClient.get('/v1/forecast?latitude=40.7128&longitude=-74.0060');
 *     expect(response).toHaveProperty('current_weather');
 *   });
 * });
 * ```
 */

// ============================================================================
// CONFIGURATION FOR TEST ENVIRONMENTS
// ============================================================================

/**
 * Test environment configurations
 */
export const TEST_ENVIRONMENTS = {
  development: {
    description: 'Development environment - use real APIs',
    useRealApis: true,
    timeout: 10000,
    retryAttempts: 1,
    cacheResponses: false,
  },
  
  ci: {
    description: 'CI environment - use real APIs with longer timeouts',
    useRealApis: true,
    timeout: 30000,
    retryAttempts: 2,
    cacheResponses: false,
  },
  
  staging: {
    description: 'Staging environment - use real APIs',
    useRealApis: true,
    timeout: 15000,
    retryAttempts: 1,
    cacheResponses: true,
  },
  
  mock: {
    description: 'Mock environment - use mocked responses',
    useRealApis: false,
    timeout: 1000,
    retryAttempts: 0,
    cacheResponses: true,
  },
};

/**
 * Get current test environment configuration
 */
export function getTestEnvironment() {
  const env = process.env.TEST_ENV || 'development';
  return TEST_ENVIRONMENTS[env as keyof typeof TEST_ENVIRONMENTS] || 
         TEST_ENVIRONMENTS.development;
}

export default EXTERNAL_APIS;