import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { oauthConfig } from '../config/jwt.config';
import { OAuthProfile } from '../types/auth.types';

export const configureGoogleStrategy = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: oauthConfig.google.clientID,
        clientSecret: oauthConfig.google.clientSecret,
        callbackURL: oauthConfig.google.callbackURL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const oauthProfile: OAuthProfile = {
            id: profile.id,
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
            provider: 'GOOGLE',
          };
          
          done(null, oauthProfile);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
};
