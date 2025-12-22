import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { OAuthService } from '../services/oauth.service';
import { TwoFactorService } from '../services/two-factor.service';
import { PhoneVerificationService } from '../services/phone-verification.service';
import { AuthRequest } from '../middleware/auth.middleware';

const authService = new AuthService();
const oauthService = new OAuthService();
const twoFactorService = new TwoFactorService();
const phoneVerificationService = new PhoneVerificationService();

export class AuthController {
    /**
     * Register a new user
     * POST /api/auth/register
     */
    async register(req: Request, res: Response) {
        try {
            const { email, password, firstName, lastName, phone } = req.body;

            const result = await authService.register({
                email,
                password,
                firstName,
                lastName,
                phone,
            });

            res.status(201).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error('Register error:', error);
            
            if (error.message === 'User already exists') {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Login with email and password
     * POST /api/auth/login
     */
    async login(req: Request, res: Response) {
        try {
            const { email, password, twoFactorCode } = req.body;

            // First, verify email and password
            const user = await authService.findUserByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials',
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated',
                });
            }

            // Check password
            const isPasswordValid = await authService.verifyPassword(user.id, password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials',
                });
            }

            // Check if 2FA is enabled
            const is2FAEnabled = await twoFactorService.isEnabled(user.id);
            if (is2FAEnabled) {
                // If 2FA is enabled but no code provided, return requires2FA flag
                if (!twoFactorCode) {
                    return res.status(200).json({
                        success: false,
                        requires2FA: true,
                        message: '2FA code required',
                    });
                }

                // Validate 2FA code
                const is2FAValid = await twoFactorService.validateToken(user.id, twoFactorCode);
                if (!is2FAValid) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid 2FA code. Please try again.',
                    });
                }
            }

            // If we get here, authentication is successful
            const result = await authService.completeLogin(user.id);

            res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error('Login error:', error);

            if (error.message === 'Invalid credentials' || error.message === 'Account is deactivated') {
                return res.status(401).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Initiate Google OAuth flow
     * GET /api/auth/google
     */
    async googleAuth(_req: Request, res: Response) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';
        
        if (!clientId) {
            return res.status(501).json({
                success: false,
                message: 'Google OAuth not configured',
            });
        }

        // Generate state for CSRF protection
        const state = oauthService.generateState();

        const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            'response_type=code&' +
            'scope=email%20profile&' +
            'access_type=offline&' +
            'prompt=consent&' +
            `state=${state}`;

        res.json({
            success: true,
            data: { 
                authUrl: googleAuthUrl,
                state, // Frontend should store this and verify on callback
            },
        });
    }

    /**
     * Handle Google OAuth callback
     * GET /api/auth/google/callback
     */
    async googleCallback(req: Request, res: Response) {
        try {
            const { code, error, error_description } = req.query;

            // Handle OAuth errors from Google
            if (error) {
                console.error('Google OAuth error:', error, error_description);
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(String(error_description || error))}`);
            }

            if (!code || typeof code !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Authorization code required',
                });
            }

            // Exchange code for tokens and get user info
            const userData = await oauthService.processGoogleCallback(code);

            // Login or register the user
            const result = await authService.oauthLogin({
                provider: userData.provider,
                providerId: userData.providerId,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                avatar: userData.avatar,
            });

            // Redirect to frontend with tokens
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const params = new URLSearchParams({
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                isNewUser: String(result.isNewUser || false),
            });

            res.redirect(`${frontendUrl}/oauth/callback?${params.toString()}`);
        } catch (error: any) {
            console.error('Google callback error:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('OAuth authentication failed')}`);
        }
    }

    /**
     * Initiate Apple OAuth flow
     * GET /api/auth/apple
     */
    async appleAuth(_req: Request, res: Response) {
        const clientId = process.env.APPLE_CLIENT_ID;
        const redirectUri = process.env.APPLE_REDIRECT_URI || 'http://localhost:3001/api/auth/apple/callback';

        if (!clientId) {
            return res.status(501).json({
                success: false,
                message: 'Apple OAuth not configured',
            });
        }

        // Generate state and nonce for security
        const state = oauthService.generateState();
        const nonce = oauthService.generateNonce();

        const appleAuthUrl = 'https://appleid.apple.com/auth/authorize?' +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            'response_type=code%20id_token&' +
            'scope=name%20email&' +
            'response_mode=form_post&' +
            `state=${state}&` +
            `nonce=${nonce}`;

        res.json({
            success: true,
            data: { 
                authUrl: appleAuthUrl,
                state, // Frontend should store this and verify on callback
                nonce, // Frontend should store this for token verification
            },
        });
    }

    /**
     * Handle Apple OAuth callback
     * POST /api/auth/apple/callback (Apple uses POST with form_post response mode)
     */
    async appleCallback(req: Request, res: Response) {
        try {
            const { id_token, user: userJson, error } = req.body;

            // Handle OAuth errors from Apple
            if (error) {
                console.error('Apple OAuth error:', error);
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(String(error))}`);
            }

            if (!id_token) {
                return res.status(400).json({
                    success: false,
                    message: 'ID token required',
                });
            }

            // Parse user data if provided (only sent on first authorization)
            let user;
            if (userJson) {
                try {
                    user = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
                } catch {
                    // User data parsing failed, continue without it
                }
            }

            // Verify ID token and get user data
            const userData = await oauthService.processAppleCallback(id_token, user);

            // Login or register the user
            const result = await authService.oauthLogin({
                provider: userData.provider,
                providerId: userData.providerId,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
            });

            // Redirect to frontend with tokens
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const params = new URLSearchParams({
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                isNewUser: String(result.isNewUser || false),
            });

            res.redirect(`${frontendUrl}/oauth/callback?${params.toString()}`);
        } catch (error: any) {
            console.error('Apple callback error:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('OAuth authentication failed')}`);
        }
    }

    /**
     * OAuth login endpoint for mobile/frontend
     * POST /api/auth/oauth
     */
    async oauthLogin(req: Request, res: Response) {
        try {
            const { provider, providerId, email, firstName, lastName, avatar } = req.body;

            if (!['google', 'apple'].includes(provider)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid OAuth provider',
                });
            }

            const result = await authService.oauthLogin({
                provider,
                providerId,
                email,
                firstName,
                lastName,
                avatar,
            });

            res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error('OAuth login error:', error);

            if (error.message === 'Account is deactivated') {
                return res.status(401).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Refresh access token
     * POST /api/auth/refresh
     */
    async refreshToken(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token required',
                });
            }

            const result = await authService.refreshToken(refreshToken);

            res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error('Refresh token error:', error);

            if (error.message.includes('token')) {
                return res.status(401).json({
                    success: false,
                    message: error.message,
                    code: 'REFRESH_TOKEN_INVALID',
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Logout user
     * POST /api/auth/logout
     */
    async logout(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;

            if (refreshToken) {
                await authService.logout(refreshToken);
            }

            res.json({
                success: true,
                message: 'Logged out successfully',
            });
        } catch (error: any) {
            console.error('Logout error:', error);
            // Always return success for logout
            res.json({
                success: true,
                message: 'Logged out successfully',
            });
        }
    }

    /**
     * Logout from all devices
     * POST /api/auth/logout-all
     */
    async logoutAll(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            await authService.logoutAll(req.user.id);

            res.json({
                success: true,
                message: 'Logged out from all devices',
            });
        } catch (error: any) {
            console.error('Logout all error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Get current user profile
     * GET /api/auth/me
     */
    async getCurrentUser(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const user = await authService.getProfile(req.user.id);

            res.json({
                success: true,
                data: { user },
            });
        } catch (error: any) {
            console.error('Get current user error:', error);

            if (error.message === 'User not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Update user profile
     * PATCH /api/auth/me
     */
    async updateProfile(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const user = await authService.updateProfile(req.user.id, req.body);

            res.json({
                success: true,
                data: { user },
            });
        } catch (error: any) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Change password
     * POST /api/auth/change-password
     */
    async changePassword(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const { currentPassword, newPassword, twoFactorCode } = req.body;

            // Check if 2FA is enabled and require it for password change
            const is2FAEnabled = await twoFactorService.isEnabled(req.user.id);
            if (is2FAEnabled) {
                if (!twoFactorCode) {
                    return res.status(400).json({
                        success: false,
                        message: '2FA code required for password change',
                        requires2FA: true,
                    });
                }

                const is2FAValid = await twoFactorService.validateToken(req.user.id, twoFactorCode);
                if (!is2FAValid) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid 2FA code',
                    });
                }
            }

            await authService.changePassword(req.user.id, currentPassword, newPassword);

            res.json({
                success: true,
                message: 'Password changed successfully',
            });
        } catch (error: any) {
            console.error('Change password error:', error);

            if (error.message === 'Current password is incorrect') {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Request password reset
     * POST /api/auth/forgot-password
     * Note: For account recovery, verified phone is recommended but not strictly required
     * to allow recovery if phone is lost
     */
    async forgotPassword(req: Request, res: Response) {
        try {
            const { email } = req.body;

            // Check if user has verified phone (for security)
            const user = await authService.findUserByEmail(email);
            if (user) {
                const isPhoneVerified = await phoneVerificationService.isPhoneVerified(user.id);
                if (!isPhoneVerified) {
                    // Log warning but still allow password reset
                    console.warn(`Password reset requested for user ${user.id} without verified phone`);
                }
            }

            await authService.requestPasswordReset(email);

            // Always return success to prevent email enumeration
            res.json({
                success: true,
                message: 'If the email exists, a reset link will be sent',
            });
        } catch (error: any) {
            console.error('Forgot password error:', error);
            res.json({
                success: true,
                message: 'If the email exists, a reset link will be sent',
            });
        }
    }

    /**
     * Reset password with token
     * POST /api/auth/reset-password
     */
    async resetPassword(req: Request, res: Response) {
        try {
            const { token, newPassword } = req.body;

            await authService.resetPassword(token, newPassword);

            res.json({
                success: true,
                message: 'Password reset successfully',
            });
        } catch (error: any) {
            console.error('Reset password error:', error);

            if (error.message.includes('token')) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token',
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Verify email
     * GET /api/auth/verify-email
     */
    async verifyEmail(req: Request, res: Response) {
        try {
            const { token } = req.query;

            if (!token || typeof token !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Verification token required',
                });
            }

            await authService.verifyEmail(token);

            res.json({
                success: true,
                message: 'Email verified successfully',
            });
        } catch (error: any) {
            console.error('Verify email error:', error);
            res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token',
            });
        }
    }

    // ============================================
    // Admin Methods
    // ============================================

    /**
     * Get all users (admin only)
     * GET /api/auth/users
     */
    async getAllUsers(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const search = req.query.search as string;
            const role = req.query.role as string;
            const status = req.query.status as string;

            const result = await authService.getAllUsers({
                page,
                limit,
                search,
                role,
                isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
            });

            res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error('Get all users error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Get user by ID
     * GET /api/auth/users/:userId
     */
    async getUserById(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.userId, 10);

            const user = await authService.getProfile(userId);

            res.json({
                success: true,
                data: { user },
            });
        } catch (error: any) {
            console.error('Get user by ID error:', error);

            if (error.message === 'User not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Update user status (admin only)
     * PATCH /api/auth/users/:userId/status
     */
    async updateUserStatus(req: AuthRequest, res: Response) {
        try {
            const userId = parseInt(req.params.userId, 10);
            const { isActive } = req.body;

            const user = await authService.updateUserStatus(userId, isActive, req.user?.id);

            res.json({
                success: true,
                data: { user },
                message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            });
        } catch (error: any) {
            console.error('Update user status error:', error);

            if (error.message === 'User not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            if (error.message === 'Cannot deactivate yourself') {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Update user role (admin only)
     * PATCH /api/auth/users/:userId/role
     */
    async updateUserRole(req: AuthRequest, res: Response) {
        try {
            const userId = parseInt(req.params.userId, 10);
            const { role } = req.body;

            const user = await authService.updateUserRole(userId, role, req.user?.id);

            res.json({
                success: true,
                data: { user },
                message: `User role updated to ${role}`,
            });
        } catch (error: any) {
            console.error('Update user role error:', error);

            if (error.message === 'User not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            if (error.message === 'Cannot change your own role') {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Delete user (admin only)
     * DELETE /api/auth/users/:userId
     */
    async deleteUser(req: AuthRequest, res: Response) {
        try {
            const userId = parseInt(req.params.userId, 10);

            await authService.deleteUser(userId, req.user?.id);

            res.json({
                success: true,
                message: 'User deleted successfully',
            });
        } catch (error: any) {
            console.error('Delete user error:', error);

            if (error.message === 'User not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            if (error.message === 'Cannot delete yourself') {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    // ============================================
    // Two-Factor Authentication (2FA) Methods
    // ============================================

    /**
     * Generate 2FA secret and QR code
     * POST /api/auth/2fa/setup
     */
    async setup2FA(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const result = await twoFactorService.generateSecret(req.user.id, req.user.email);

            res.json({
                success: true,
                data: {
                    secret: result.secret,
                    qrCodeUrl: result.qrCodeUrl,
                    // Backup codes are shown only once during setup
                    backupCodes: result.backupCodes,
                },
            });
        } catch (error: any) {
            console.error('Setup 2FA error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Enable 2FA after verifying token
     * POST /api/auth/2fa/enable
     */
    async enable2FA(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: '2FA code is required',
                });
            }

            const result = await twoFactorService.verifyAndEnable(req.user.id, token);

            res.json({
                success: true,
                message: '2FA enabled successfully',
                data: {
                    backupCodes: result.backupCodes, // Show backup codes only once
                },
            });
        } catch (error: any) {
            console.error('Enable 2FA error:', error);

            if (error.message.includes('Invalid') || error.message.includes('not initiated')) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Disable 2FA
     * POST /api/auth/2fa/disable
     */
    async disable2FA(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: '2FA code is required to disable 2FA',
                });
            }

            await twoFactorService.disable(req.user.id, token);

            res.json({
                success: true,
                message: '2FA disabled successfully',
            });
        } catch (error: any) {
            console.error('Disable 2FA error:', error);

            if (error.message.includes('Invalid')) {
                return res.status(401).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Get 2FA status
     * GET /api/auth/2fa/status
     */
    async get2FAStatus(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const isEnabled = await twoFactorService.isEnabled(req.user.id);

            res.json({
                success: true,
                data: {
                    enabled: isEnabled,
                },
            });
        } catch (error: any) {
            console.error('Get 2FA status error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Regenerate backup codes
     * POST /api/auth/2fa/regenerate-backup-codes
     */
    async regenerateBackupCodes(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: '2FA code is required',
                });
            }

            const backupCodes = await twoFactorService.regenerateBackupCodes(req.user.id, token);

            res.json({
                success: true,
                message: 'Backup codes regenerated successfully',
                data: {
                    backupCodes, // Show codes only once
                },
            });
        } catch (error: any) {
            console.error('Regenerate backup codes error:', error);

            if (error.message.includes('Invalid')) {
                return res.status(401).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    // ============================================
    // Phone Verification Methods
    // ============================================

    /**
     * Add phone number
     * POST /api/auth/phone/add
     */
    async addPhoneNumber(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const { phoneNumber } = req.body;

            if (!phoneNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number is required',
                });
            }

            await phoneVerificationService.addPhoneNumber(req.user.id, phoneNumber);

            res.json({
                success: true,
                message: 'Phone number added successfully. Please verify with OTP.',
            });
        } catch (error: any) {
            console.error('Add phone number error:', error);

            if (error.message.includes('Invalid') || error.message.includes('already verified')) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Send OTP to phone number
     * POST /api/auth/phone/send-otp
     */
    async sendOtp(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            await phoneVerificationService.sendOtp(req.user.id);

            res.json({
                success: true,
                message: 'OTP code sent successfully to your phone number',
            });
        } catch (error: any) {
            console.error('Send OTP error:', error);

            if (error.message.includes('not added') || error.message.includes('Too many')) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Verify OTP code
     * POST /api/auth/phone/verify
     */
    async verifyOtp(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const { otpCode } = req.body;

            if (!otpCode) {
                return res.status(400).json({
                    success: false,
                    message: 'OTP code is required',
                });
            }

            await phoneVerificationService.verifyOtp(req.user.id, otpCode);

            res.json({
                success: true,
                message: 'Phone number verified successfully',
            });
        } catch (error: any) {
            console.error('Verify OTP error:', error);

            if (
                error.message.includes('Invalid') ||
                error.message.includes('expired') ||
                error.message.includes('Too many') ||
                error.message.includes('No OTP')
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Get phone verification status
     * GET /api/auth/phone/status
     */
    async getPhoneVerificationStatus(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            const status = await phoneVerificationService.getVerificationStatus(req.user.id);

            res.json({
                success: true,
                data: status,
            });
        } catch (error: any) {
            console.error('Get phone verification status error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }

    /**
     * Remove phone number
     * DELETE /api/auth/phone
     */
    async removePhoneNumber(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }

            await phoneVerificationService.removePhoneNumber(req.user.id);

            res.json({
                success: true,
                message: 'Phone number removed successfully',
            });
        } catch (error: any) {
            console.error('Remove phone number error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
            });
        }
    }
}
