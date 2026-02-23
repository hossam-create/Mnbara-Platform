import { Module, NestModule, MiddlewareConsumer, Logger } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Module({
  providers: [GatewayService],
  exports: [GatewayService],
})
export class GatewayModule implements NestModule {
  private readonly logger = new Logger(GatewayModule.name);

  constructor(private readonly gatewayService: GatewayService) {}

  configure(consumer: MiddlewareConsumer) {
    const services = this.gatewayService.getServicesConfig();

    services.forEach(service => {
      service.routes.forEach(route => {
        const proxyOptions = this.gatewayService.createProxyOptions(route.target, route.pathRewrite);
        const proxy = createProxyMiddleware(proxyOptions);

        consumer.apply(proxy).forRoutes(route.path);

        this.logger.log(`Registered proxy: ${route.path} -> ${route.target}`);
      });
    });
  }
}
