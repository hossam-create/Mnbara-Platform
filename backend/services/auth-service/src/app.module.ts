import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { SessionModule } from './session/session.module';
import { PrismaModule } from './common/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PassportModule.register({ 
      defaultStrategy: 'jwt',
      session: false, // We use JWT, not sessions for API auth
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      signOptions: { 
        expiresIn: '15m', // Short-lived access tokens
      },
    }),
    PrismaModule,
    AuthModule,
    SessionModule,
  ],
})
export class AppModule {}
