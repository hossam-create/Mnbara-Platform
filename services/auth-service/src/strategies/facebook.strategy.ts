import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { OAuthProfile } from '../types/auth.types';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('FACEBOOK_CLIENT_ID') || '',
      clientSecret: configService.get<string>('FACEBOOK_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL') || 'http://localhost:3001/auth/facebook/callback',
      profileFields: ['id', 'emails', 'name', 'picture'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void,
  ): Promise<any> {
    const oauthProfile: OAuthProfile = {
      id: profile.id,
      email: profile.emails?.[0]?.value || '',
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value,
      provider: 'FACEBOOK',
    };

    done(null, oauthProfile);
  }
}

