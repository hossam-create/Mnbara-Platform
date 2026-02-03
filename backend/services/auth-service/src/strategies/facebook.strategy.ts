import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { oauthConfig } from '../config/jwt.config';
import { OAuthProfile } from '../types/auth.types';

export const configureFacebookStrategy = () => {
  passport.use(
    new FacebookStrategy(
      {
        clientID: oauthConfig.facebook.clientID,
        clientSecret: oauthConfig.facebook.clientSecret,
        callbackURL: oauthConfig.facebook.callbackURL,
        profileFields: ['id', 'emails', 'name', 'picture'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const oauthProfile: OAuthProfile = {
            id: profile.id,
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
            provider: 'FACEBOOK',
          };
          
          done(null, oauthProfile);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
};
