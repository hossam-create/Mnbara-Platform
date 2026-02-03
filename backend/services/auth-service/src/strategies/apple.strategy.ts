import passport from 'passport';
import { Strategy as AppleStrategy } from 'passport-apple';
import { oauthConfig } from '../config/jwt.config';
import { OAuthProfile } from '../types/auth.types';

export const configureAppleStrategy = () => {
  passport.use(
    new AppleStrategy(
      {
        clientID: oauthConfig.apple.clientID,
        teamID: oauthConfig.apple.teamID,
        keyID: oauthConfig.apple.keyID,
        privateKeyString: oauthConfig.apple.privateKey,
        callbackURL: oauthConfig.apple.callbackURL,
        scope: ['name', 'email'],
      },
      async (accessToken, refreshToken, idToken, profile, done) => {
        try {
          const oauthProfile: OAuthProfile = {
            id: profile.id,
            email: profile.email || '',
            name: profile.name ? `${profile.name.firstName} ${profile.name.lastName}` : undefined,
            provider: 'APPLE',
          };
          
          done(null, oauthProfile);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
};
