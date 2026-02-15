import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import winston from 'winston';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { authenticateToken } from './middleware/auth';

// Import routes
import countryRoutes from './routes/countries';
import productCountryRoutes from './routes/productCountries';
import countryRuleRoutes from './routes/countryRules';
import travelerRouteRoutes from './routes/travelerRoutes';
import complianceRoutes from './routes/compliance';
import analyticsRoutes from './routes/analytics';

// Import services
import { CountryService } from './services/CountryService';
import { ProductCountryService } from './services/ProductCountryService';
import { CountryRuleService } from './services/CountryRuleService';
import { TravelerRouteService } from './services/TravelerRouteService';
import { ComplianceService } from './services/ComplianceService';
import { AnalyticsService } from './services/AnalyticsService';
import { CacheService } from './services/CacheService';
import { EventBus } from './services/EventBus';

class CountryLayerService {
  private app: express.Application;
  private prisma: PrismaClient;
  private redis: Redis;
  private logger: winston.Logger;
  
  // Services
  private countryService: CountryService;
  private productCountryService: ProductCountryService;
  private countryRuleService: CountryRuleService;
  private travelerRouteService: TravelerRouteService;
  private complianceService: ComplianceService;
  private analyticsService: AnalyticsService;
  private cacheService: CacheService;
  private eventBus: EventBus;

  constructor() {
    this.app = express();
    this.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
    });
    this.logger = this.initializeLogger();
    
    // Initialize services
    this.initializeServices();
    
    // Setup middleware
    this.setupMiddleware();
    
    // Setup routes
    this.setupRoutes();
    
    // Setup error handling
    this.setupErrorHandling();
  }

  private initializeLogger(): winston.Logger {
    return winston.createLogger({
      level: config.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log' 
        })
      ]
    });
  }

  private initializeServices(): void {
    this.cacheService = new CacheService(this.redis, this.logger);
    this.eventBus = new EventBus(this.redis, this.logger);
    
    this.countryService = new CountryService(this.prisma, this.cacheService, this.logger);
    this.productCountryService = new ProductCountryService(this.prisma, this.cacheService, this.logger);
    this.countryRuleService = new CountryRuleService(this.prisma, this.cacheService, this.logger);
    this.travelerRouteService = new TravelerRouteService(this.prisma, this.cacheService, this.logger);
    this.complianceService = new ComplianceService(
      this.prisma, 
      this.cacheService, 
      this.eventBus, 
      this.logger
    );
    this.analyticsService = new AnalyticsService(this.prisma, this.cacheService, this.logger);
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));
    
    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origins,
      credentials: true,
      optionsSuccessStatus: 200
    }));
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging
    this.app.use(requestLogger(this.logger));
    
    // Rate limiting
    this.app.use('/api', rateLimiter(this.redis));
  }

  private setupRoutes(): void {
    // Health check endpoint (no auth required)
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        service: 'country-layer-service',
        version: config.version,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Detailed health check
    this.app.get('/health/detailed', async (req, res) => {
      try {
        const healthCheck = await this.performHealthCheck();
        res.status(healthCheck.status === 'healthy' ? 200 : 503).json(healthCheck);
      } catch (error) {
        this.logger.error('Health check failed', error);
        res.status(503).json({
          status: 'unhealthy',
          error: error.message
        });
      }
    });

    // API routes (with authentication)
    this.app.use('/api/v1/countries', authenticateToken, countryRoutes);
    this.app.use('/api/v1/countries/products', authenticateToken, productCountryRoutes);
    this.app.use('/api/v1/countries/rules', authenticateToken, countryRuleRoutes);
    this.app.use('/api/v1/countries/travelers', authenticateToken, travelerRouteRoutes);
    this.app.use('/api/v1/countries/compliance', authenticateToken, complianceRoutes);
    this.app.use('/api/v1/countries/analytics', authenticateToken, analyticsRoutes);

    // Documentation endpoint
    this.app.get('/docs', (req, res) => {
      res.json({
        service: 'Country Layer Engine',
        version: config.version,
        endpoints: {
          countries: '/api/v1/countries',
          productCountries: '/api/v1/countries/products',
          countryRules: '/api/v1/countries/rules',
          travelerRoutes: '/api/v1/countries/travelers',
          compliance: '/api/v1/countries/compliance',
          analytics: '/api/v1/countries/analytics'
        },
        documentation: 'https://github.com/mnbara/country-layer-service'
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
      });
    });

    // Global error handler
    this.app.use(errorHandler(this.logger));
  }

  private async performHealthCheck(): Promise<any> {
    const checks = [];
    
    // Database health check
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.push({
        name: 'database',
        status: 'healthy',
        responseTime: Date.now()
      });
    } catch (error) {
      checks.push({
        name: 'database',
        status: 'unhealthy',
        error: error.message
      });
    }

    // Redis health check
    try {
      await this.redis.ping();
      checks.push({
        name: 'redis',
        status: 'healthy'
      });
    } catch (error) {
      checks.push({
        name: 'redis',
        status: 'unhealthy',
        error: error.message
      });
    }

    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const status = unhealthyCount === 0 ? 'healthy' : 
                  unhealthyCount <= 1 ? 'degraded' : 'unhealthy';

    return {
      status,
      service: 'country-layer-service',
      version: config.version,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      environment: config.nodeEnv
    };
  }

  public async start(): Promise<void> {
    try {
      // Test database connection
      await this.prisma.$connect();
      this.logger.info('Database connected successfully');

      // Test Redis connection
      await this.redis.ping();
      this.logger.info('Redis connected successfully');

      // Start server
      const port = config.port;
      this.app.listen(port, () => {
        this.logger.info(`Country Layer Service started on port ${port}`);
        this.logger.info(`Health check: http://localhost:${port}/health`);
        this.logger.info(`Documentation: http://localhost:${port}/docs`);
      });

    } catch (error) {
      this.logger.error('Failed to start service', error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down Country Layer Service...');
    
    try {
      await this.prisma.$disconnect();
      this.logger.info('Database disconnected');
      
      await this.redis.quit();
      this.logger.info('Redis disconnected');
      
      this.logger.info('Country Layer Service shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown', error);
    }
  }
}

// Graceful shutdown
const service = new CountryLayerService();

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await service.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await service.shutdown();
  process.exit(0);
});

// Start the service
if (require.main === module) {
  service.start().catch((error) => {
    console.error('Failed to start service:', error);
    process.exit(1);
  });
}

export { CountryLayerService };