import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Type alias for UserRole enum
type UserRole = 'USER' | 'SELLER' | 'TRAVELER' | 'BUYER' | 'ADMIN' | 'SUPER_ADMIN';

// Token configuration from environment or defaults
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

// Parse refresh token expiry to milliseconds
function parseExpiryToMs(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days
    
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 7 * 24 * 60 * 60 * 1000;
    }
}

const REFRESH_TOKEN_EXPIRY_MS = parseExpiryToMs(REFRESH_TOKEN_EXPIRY);

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: UserRole;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface OAuthData {
    provider: 'google' | 'apple';
    providerId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
}

export class AuthService {
    /**
     * Generate JWT Access Token
     */
    private generateAccessToken(userId: number, role: UserRole): string {
        return jwt.sign(
            { userId, role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: ACCESS_TOKEN_EXPIRY as jwt.SignOptions['expiresIn'] }
        );
    }

    /**
     * Generate Refresh Token and store in database
     */
    private async generateRefreshToken(userId: number): Promise<string> {
        const token = crypto.randomBytes(64).toString('hex');
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

        await prisma.refreshToken.create({
            data: {
                token,
                userId,
                expiresAt,
            },
        });

        return token;
    }

    /**
     * Generate both access and refresh tokens
     */
    private async generateTokenPair(userId: number, role: UserRole): Promise<TokenPair> {
        const accessToken = this.generateAccessToken(userId, role);
        const refreshToken = await this.generateRefreshToken(userId);
        return { accessToken, refreshToken };
    }

    /**
     * Register a new user
     */
    async register(data: RegisterData) {
        const { email, password, firstName, lastName, phone, role = 'BUYER' } = data;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                fullName: `${firstName} ${lastName}`,
                phone,
                role: role as UserRole,
            },
        });

        // Generate tokens
        const tokens = await this.generateTokenPair(user.id, user.role);

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }

    /**
     * Login user with email and password
     */
    async login(data: LoginData) {
        const { email, password } = data;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.password) {
            throw new Error('Invalid credentials');
        }

        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        // Generate tokens
        const tokens = await this.generateTokenPair(user.id, user.role);

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }

    /**
     * Find user by email (helper for 2FA login flow)
     */
    async findUserByEmail(email: string) {
        return await prisma.user.findUnique({
            where: { email },
        });
    }

    /**
     * Verify password for a user (helper for 2FA login flow)
     */
    async verifyPassword(userId: number, password: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true, isActive: true },
        });

        if (!user || !user.password || !user.isActive) {
            return false;
        }

        return await bcrypt.compare(password, user.password);
    }

    /**
     * Complete login after 2FA verification (helper for 2FA login flow)
     */
    async completeLogin(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        // Generate tokens
        const tokens = await this.generateTokenPair(user.id, user.role);

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }

    /**
     * OAuth login/register (Google, Apple)
     */
    async oauthLogin(data: OAuthData) {
        const { provider, providerId, email, firstName, lastName, avatar } = data;

        // Build the where clause based on provider
        const providerIdField = provider === 'google' ? 'googleId' : 'appleId';

        // Check if user exists by provider ID or email
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { [providerIdField]: providerId },
                    { email },
                ],
            },
        });

        if (user) {
            // Update provider ID if not set
            if (!user[providerIdField as keyof typeof user]) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { [providerIdField]: providerId },
                });
            }
        } else {
            // Create new user
            user = await prisma.user.create({
                data: {
                    email,
                    firstName,
                    lastName,
                    fullName: `${firstName} ${lastName}`,
                    avatar,
                    [providerIdField]: providerId,
                    emailVerified: true, // OAuth emails are verified
                    role: 'BUYER',
                },
            });
        }

        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        // Generate tokens
        const tokens = await this.generateTokenPair(user.id, user.role);

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        return {
            user: this.sanitizeUser(user),
            ...tokens,
            isNewUser: !user.lastLoginAt,
        };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken(refreshToken: string) {
        // Find the refresh token
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });

        if (!storedToken) {
            throw new Error('Invalid refresh token');
        }

        // Check if token is expired
        if (storedToken.expiresAt < new Date()) {
            // Delete expired token
            await prisma.refreshToken.delete({
                where: { id: storedToken.id },
            });
            throw new Error('Refresh token expired');
        }

        // Check if token is revoked
        if (storedToken.revokedAt) {
            throw new Error('Refresh token revoked');
        }

        // Check if user is active
        if (!storedToken.user.isActive) {
            throw new Error('Account is deactivated');
        }

        // Rotate refresh token (delete old, create new)
        await prisma.refreshToken.delete({
            where: { id: storedToken.id },
        });

        // Generate new token pair
        const tokens = await this.generateTokenPair(
            storedToken.user.id,
            storedToken.user.role
        );

        return {
            user: this.sanitizeUser(storedToken.user),
            ...tokens,
        };
    }

    /**
     * Logout user - revoke refresh token
     */
    async logout(refreshToken: string) {
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });

        if (storedToken) {
            await prisma.refreshToken.update({
                where: { id: storedToken.id },
                data: { revokedAt: new Date() },
            });
        }

        return { success: true };
    }

    /**
     * Logout from all devices - revoke all refresh tokens
     */
    async logoutAll(userId: number) {
        await prisma.refreshToken.updateMany({
            where: {
                userId,
                revokedAt: null,
            },
            data: { revokedAt: new Date() },
        });

        return { success: true };
    }

    /**
     * Get user profile
     */
    async getProfile(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                wallet: true,
                listings: { take: 5, orderBy: { createdAt: 'desc' } },
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return this.sanitizeUser(user);
    }

    /**
     * Update user profile
     */
    async updateProfile(userId: number, data: Record<string, any>) {
        // Fields that cannot be updated via this method
        const forbiddenFields = ['id', 'email', 'password', 'role', 'googleId', 'appleId'];
        
        const updateData: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            if (!forbiddenFields.includes(key)) {
                updateData[key] = value;
            }
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        return this.sanitizeUser(user);
    }

    /**
     * Change password
     */
    async changePassword(userId: number, currentPassword: string, newPassword: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.password) {
            throw new Error('User not found or no password set');
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            throw new Error('Current password is incorrect');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        // Revoke all refresh tokens for security
        await this.logoutAll(userId);

        return { success: true };
    }

    /**
     * Verify email (stub for email verification flow)
     */
    async verifyEmail(token: string) {
        // TODO: Implement email verification token validation
        // This would typically involve:
        // 1. Validate the verification token
        // 2. Update user's emailVerified to true
        // 3. Delete the verification token
        return { success: true, message: 'Email verification endpoint' };
    }

    /**
     * Request password reset (stub)
     */
    async requestPasswordReset(email: string) {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return { success: true, message: 'If the email exists, a reset link will be sent' };
        }

        // TODO: Implement password reset token generation and email sending
        // This would typically involve:
        // 1. Generate a secure reset token
        // 2. Store it with expiration
        // 3. Send email with reset link

        return { success: true, message: 'If the email exists, a reset link will be sent' };
    }

    /**
     * Reset password with token (stub)
     */
    async resetPassword(token: string, newPassword: string) {
        // TODO: Implement password reset token validation
        // This would typically involve:
        // 1. Validate the reset token
        // 2. Hash and update the password
        // 3. Delete the reset token
        // 4. Revoke all refresh tokens
        return { success: true, message: 'Password reset endpoint' };
    }

    /**
     * Remove sensitive fields from user object
     */
    private sanitizeUser(user: any) {
        const { password, googleId, appleId, facebookId, ...sanitized } = user;
        return sanitized;
    }

    /**
     * Clean up expired refresh tokens (for scheduled job)
     */
    async cleanupExpiredTokens() {
        const result = await prisma.refreshToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { revokedAt: { not: null } },
                ],
            },
        });

        return { deletedCount: result.count };
    }

    // ============================================
    // Admin Methods
    // ============================================

    /**
     * Get all users with pagination and filters (admin only)
     */
    async getAllUsers(options: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        isActive?: boolean;
    }) {
        const { page = 1, limit = 20, search, role, isActive } = options;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { fullName: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role) {
            where.role = role;
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        // Get users and total count
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    fullName: true,
                    phone: true,
                    avatar: true,
                    role: true,
                    isActive: true,
                    emailVerified: true,
                    kycStatus: true,
                    rating: true,
                    createdAt: true,
                    lastLoginAt: true,
                },
            }),
            prisma.user.count({ where }),
        ]);

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Update user status (activate/deactivate)
     */
    async updateUserStatus(userId: number, isActive: boolean, adminId?: number) {
        // Prevent admin from deactivating themselves
        if (adminId && userId === adminId && !isActive) {
            throw new Error('Cannot deactivate yourself');
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { isActive },
        });

        // If deactivating, revoke all refresh tokens
        if (!isActive) {
            await this.logoutAll(userId);
        }

        return this.sanitizeUser(updatedUser);
    }

    /**
     * Update user role
     */
    async updateUserRole(userId: number, role: UserRole, adminId?: number) {
        // Prevent admin from changing their own role
        if (adminId && userId === adminId) {
            throw new Error('Cannot change your own role');
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role },
        });

        // Revoke all refresh tokens to force re-login with new role
        await this.logoutAll(userId);

        return this.sanitizeUser(updatedUser);
    }

    /**
     * Delete user (soft delete by deactivating, or hard delete)
     */
    async deleteUser(userId: number, adminId?: number) {
        // Prevent admin from deleting themselves
        if (adminId && userId === adminId) {
            throw new Error('Cannot delete yourself');
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Revoke all refresh tokens first
        await this.logoutAll(userId);

        // Soft delete by deactivating (preserves data for audit)
        await prisma.user.update({
            where: { id: userId },
            data: {
                isActive: false,
                email: `deleted_${userId}_${user.email}`, // Prevent email reuse
            },
        });

        return { success: true };
    }

    /**
     * Check if user has KYC verified status
     */
    async checkKycStatus(userId: number): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { kycStatus: true },
        });

        return user?.kycStatus === true;
    }
}
