import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { OAuthService } from '../services/oauth.service';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { GoogleStrategy } from '../strategies/google.strategy';
import { FacebookStrategy } from '../strategies/facebook.strategy';
import { AppleStrategy } from '../strategies/apple.strategy';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [
    PassportModule,
    JwtModule,
    SessionModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OAuthService,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    AppleStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
