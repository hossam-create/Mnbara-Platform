import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

// Core Services
import { DatabaseService } from './database/database.service';
import { LoggerService } from './services/logger.service';
import { ErrorTrackingService } from './services/error-tracking.service';
import { MetricsService } from './services/metrics.service';
import { WebSocketGateway } from './services/websocket.gateway';

// Blockchain Services
import { BlockchainService } from './services/blockchain.service';
import { ContractsService } from './services/contracts.service';
import { DeploymentService } from './services/deployment.service';
import { WalletService } from './services/wallet.service';
import { RedotPayService } from './services/redotpay.service';

// Modules
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { AuctionModule } from './modules/auction/auction.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SearchModule } from './modules/search/search.module';
import { MetricsController } from './modules/monitoring/metrics.controller';

// Middleware
import {
  SecurityMiddleware,
  CorsMiddleware,
  RequestLoggingMiddleware,
} from './middleware/security.middleware';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // JWT
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),

    // Feature Modules
    BlockchainModule,
    AuctionModule,
    AuthModule,
    UsersModule,
    SearchModule,
  ],

  controllers: [MetricsController],

  providers: [
    // Core Services
    DatabaseService,
    LoggerService,
    ErrorTrackingService,
    MetricsService,
    WebSocketGateway,

    // Blockchain Services
    BlockchainService,
    ContractsService,
    DeploymentService,
    WalletService,
    RedotPayService,

    // Middleware
    SecurityMiddleware,
    CorsMiddleware,
    RequestLoggingMiddleware,
  ],

  exports: [
    DatabaseService,
    LoggerService,
    ErrorTrackingService,
    MetricsService,
    WebSocketGateway,
    BlockchainService,
    ContractsService,
    WalletService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply security middleware to all routes
    consumer
      .apply(SecurityMiddleware, CorsMiddleware, RequestLoggingMiddleware)
      .forRoutes('*');
  }
}
