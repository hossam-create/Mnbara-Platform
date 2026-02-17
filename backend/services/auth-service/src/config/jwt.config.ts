export const jwtConfig = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'access-secret-key',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
};

export const oauthConfig = {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3014/auth/google/callback',
  },
  facebook: {
    clientID: process.env.FACEBOOK_APP_ID || '',
    clientSecret: process.env.FACEBOOK_APP_SECRET || '',
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3014/auth/facebook/callback',
  },
  apple: {
    clientID: process.env.APPLE_CLIENT_ID || '',
    teamID: process.env.APPLE_TEAM_ID || '',
    keyID: process.env.APPLE_KEY_ID || '',
    privateKey: process.env.APPLE_PRIVATE_KEY || '',
    callbackURL: process.env.APPLE_CALLBACK_URL || 'http://localhost:3014/auth/apple/callback',
  },
};
