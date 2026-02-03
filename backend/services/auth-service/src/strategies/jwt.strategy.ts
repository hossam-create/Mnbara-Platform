import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { jwtConfig } from '../config/jwt.config';
import { AuthService } from '../services/auth.service';
import { JWTPayload } from '../types/auth.types';

export const configureJwtStrategy = () => {
  const authService = new AuthService();

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: jwtConfig.accessTokenSecret,
      },
      async (payload: JWTPayload, done) => {
        try {
          const user = await authService.getUserById(payload.userId);
          
          if (!user) {
            return done(null, false);
          }
          
          if (user.status !== 'ACTIVE') {
            return done(null, false);
          }
          
          done(null, user);
        } catch (error) {
          done(error, false);
        }
      }
    )
  );
};
