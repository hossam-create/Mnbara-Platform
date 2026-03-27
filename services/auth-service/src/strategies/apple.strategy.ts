import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { ConfigService } from '@nestjs/config';
import { OAuthProfile } from '../types/auth.types';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('APPLE_CLIENT_ID') || '',
      teamID: configService.get<string>('APPLE_TEAM_ID') || '',
      keyID: configService.get<string>('APPLE_KEY_ID') || '',
      privateKeyString: configService.get<string>('APPLE_PRIVATE_KEY') || '',
      callbackURL: configService.get<string>('APPLE_CALLBACK_URL') || 'http://localhost:3001/auth/apple/callback',
      scope: ['name', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    idToken: any,
    profile: any,
    done: (error: any, user?: any, info?: any) => void,
  ): Promise<any> {
    const oauthProfile: OAuthProfile = {
      id: profile.id,
      email: profile.email || '',
      name: profile.name ? `${profile.name.firstName} ${profile.name.lastName}` : undefined,
      provider: 'APPLE',
    };

    done(null, oauthProfile);
  }
}

