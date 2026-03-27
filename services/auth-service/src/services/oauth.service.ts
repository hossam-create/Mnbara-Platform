import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * OAuth Service - Handles OAuth2 token exchange and verification
 * for Google and Apple providers
 */

export interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    token_type: string;
    id_token: string;
}

export interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture?: string;
}

export interface AppleIdTokenPayload {
    iss: string;
    aud: string;
    exp: number;
    iat: number;
    sub: string;
    email?: string;
    email_verified?: string | boolean;
    is_private_email?: string | boolean;
    auth_time: number;
    nonce_supported: boolean;
}

export interface OAuthUserData {
    provider: 'google' | 'apple';
    providerId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    emailVerified: boolean;
}

export class OAuthService {
    /**
     * Exchange Google authorization code for tokens
     */
    async exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';

        if (!clientId || !clientSecret) {
            throw new Error('Google OAuth not configured');
        }

        const tokenUrl = 'https://oauth2.googleapis.com/token';
        const params = new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        });

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Google token exchange error:', error);
            throw new Error('Failed to exchange Google authorization code');
        }

        return response.json() as Promise<GoogleTokenResponse>;
    }

    /**
     * Get Google user info using access token
     */
    async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
        const userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';

        const response = await fetch(userInfoUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get Google user info');
        }

        return response.json() as Promise<GoogleUserInfo>;
    }

    /**
     * Process Google OAuth callback and return user data
     */
    async processGoogleCallback(code: string): Promise<OAuthUserData> {
        // Exchange code for tokens
        const tokens = await this.exchangeGoogleCode(code);

        // Get user info
        const userInfo = await this.getGoogleUserInfo(tokens.access_token);

        return {
            provider: 'google',
            providerId: userInfo.id,
            email: userInfo.email,
            firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || '',
            lastName: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || '',
            avatar: userInfo.picture,
            emailVerified: userInfo.verified_email,
        };
    }

    /**
     * Verify Apple ID token
     */
    async verifyAppleIdToken(idToken: string): Promise<AppleIdTokenPayload> {
        const clientId = process.env.APPLE_CLIENT_ID;

        if (!clientId) {
            throw new Error('Apple OAuth not configured');
        }

        // Fetch Apple's public keys
        const keysResponse = await fetch('https://appleid.apple.com/auth/keys');
        if (!keysResponse.ok) {
            throw new Error('Failed to fetch Apple public keys');
        }

        const keysData = await keysResponse.json() as { keys: any[] };
        const { keys } = keysData;

        // Decode the token header to get the key ID
        const tokenParts = idToken.split('.');
        if (tokenParts.length !== 3) {
            throw new Error('Invalid Apple ID token format');
        }

        const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
        const kid = header.kid;

        // Find the matching key
        const key = keys.find((k: any) => k.kid === kid);
        if (!key) {
            throw new Error('Apple public key not found');
        }

        // Convert JWK to PEM format
        const publicKey = this.jwkToPem(key);

        // Verify the token
        try {
            const decoded = jwt.verify(idToken, publicKey, {
                algorithms: ['RS256'],
                issuer: 'https://appleid.apple.com',
                audience: clientId,
            }) as AppleIdTokenPayload;

            return decoded;
        } catch (error) {
            console.error('Apple token verification error:', error);
            throw new Error('Invalid Apple ID token');
        }
    }

    /**
     * Process Apple OAuth callback and return user data
     * Apple sends user info only on first authorization
     */
    async processAppleCallback(
        idToken: string,
        user?: { name?: { firstName?: string; lastName?: string }; email?: string }
    ): Promise<OAuthUserData> {
        // Verify the ID token
        const payload = await this.verifyAppleIdToken(idToken);

        // Apple only sends user info on first authorization
        // After that, we only get the sub (user ID) from the token
        const email = user?.email || payload.email || '';
        const firstName = user?.name?.firstName || '';
        const lastName = user?.name?.lastName || '';

        if (!email && !payload.sub) {
            throw new Error('Unable to get user information from Apple');
        }

        return {
            provider: 'apple',
            providerId: payload.sub,
            email: email,
            firstName: firstName,
            lastName: lastName,
            emailVerified: payload.email_verified === 'true' || payload.email_verified === true,
        };
    }

    /**
     * Generate Apple client secret (JWT)
     * Required for server-to-server communication with Apple
     */
    generateAppleClientSecret(): string {
        const teamId = process.env.APPLE_TEAM_ID;
        const clientId = process.env.APPLE_CLIENT_ID;
        const keyId = process.env.APPLE_KEY_ID;
        const privateKey = process.env.APPLE_PRIVATE_KEY;

        if (!teamId || !clientId || !keyId || !privateKey) {
            throw new Error('Apple OAuth configuration incomplete');
        }

        const now = Math.floor(Date.now() / 1000);
        const expiry = now + 86400 * 180; // 180 days

        const claims = {
            iss: teamId,
            iat: now,
            exp: expiry,
            aud: 'https://appleid.apple.com',
            sub: clientId,
        };

        return jwt.sign(claims, privateKey, {
            algorithm: 'ES256',
            header: {
                alg: 'ES256',
                kid: keyId,
            },
        });
    }

    /**
     * Convert JWK to PEM format for Apple public key verification
     */
    private jwkToPem(jwk: any): string {
        // For RS256 keys from Apple
        if (jwk.kty !== 'RSA') {
            throw new Error('Unsupported key type');
        }

        const n = Buffer.from(jwk.n, 'base64url');
        const e = Buffer.from(jwk.e, 'base64url');

        // Build the public key in DER format
        const nLen = n.length;
        const eLen = e.length;

        // RSA public key ASN.1 structure
        const rsaPublicKey = Buffer.concat([
            Buffer.from([0x30]), // SEQUENCE
            this.encodeLength(nLen + eLen + 4 + this.lengthBytes(nLen) + this.lengthBytes(eLen)),
            Buffer.from([0x02]), // INTEGER (n)
            this.encodeLength(nLen + (n[0] & 0x80 ? 1 : 0)),
            n[0] & 0x80 ? Buffer.from([0x00]) : Buffer.alloc(0),
            n,
            Buffer.from([0x02]), // INTEGER (e)
            this.encodeLength(eLen + (e[0] & 0x80 ? 1 : 0)),
            e[0] & 0x80 ? Buffer.from([0x00]) : Buffer.alloc(0),
            e,
        ]);

        // Wrap in SubjectPublicKeyInfo
        const algorithmIdentifier = Buffer.from([
            0x30, 0x0d, // SEQUENCE
            0x06, 0x09, // OID
            0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, // rsaEncryption
            0x05, 0x00, // NULL
        ]);

        const bitString = Buffer.concat([
            Buffer.from([0x03]), // BIT STRING
            this.encodeLength(rsaPublicKey.length + 1),
            Buffer.from([0x00]), // unused bits
            rsaPublicKey,
        ]);

        const spki = Buffer.concat([
            Buffer.from([0x30]), // SEQUENCE
            this.encodeLength(algorithmIdentifier.length + bitString.length),
            algorithmIdentifier,
            bitString,
        ]);

        // Convert to PEM
        const base64 = spki.toString('base64');
        const lines = base64.match(/.{1,64}/g) || [];
        return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;
    }

    private encodeLength(length: number): Buffer {
        if (length < 128) {
            return Buffer.from([length]);
        }
        const bytes = [];
        let temp = length;
        while (temp > 0) {
            bytes.unshift(temp & 0xff);
            temp >>= 8;
        }
        return Buffer.from([0x80 | bytes.length, ...bytes]);
    }

    private lengthBytes(length: number): number {
        if (length < 128) return 1;
        let bytes = 0;
        let temp = length;
        while (temp > 0) {
            bytes++;
            temp >>= 8;
        }
        return bytes + 1;
    }

    /**
     * Generate a secure state parameter for OAuth flows
     */
    generateState(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Generate a nonce for Apple Sign In
     */
    generateNonce(): string {
        return crypto.randomBytes(32).toString('base64url');
    }
}
