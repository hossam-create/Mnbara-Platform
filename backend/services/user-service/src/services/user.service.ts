/**
 * User Service
 * Core user management operations
 */

import { PrismaClient, User, UserStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export interface CreateUserDto {
  email: string;
  password?: string;
  name?: string;
  phoneNumber?: string;
}

export interface UpdateUserDto {
  name?: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: Date;
  gender?: string;
  language?: string;
  timezone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  marketingEmails?: boolean;
  pushNotifications?: boolean;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneNumberVerified: boolean;
  createdAt: Date;
}

export class UserService {
  /**
   * Create a new user
   */
  async createUser(data: CreateUserDto): Promise<User> {
    const hashedPassword = data.password 
      ? await bcrypt.hash(data.password, 10) 
      : null;

    return await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phoneNumber: data.phoneNumber,
      },
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, data: UpdateUserDto): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  /**
   * Update user status
   */
  async updateUserStatus(userId: string, status: UserStatus): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  /**
   * Verify email
   */
  async verifyEmail(userId: string): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  }

  /**
   * Verify phone number
   */
  async verifyPhoneNumber(userId: string, phoneNumber: string): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        phoneNumber,
        phoneNumberVerified: true,
      },
    });
  }

  /**
   * Update password
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Soft delete user
   */
  async deleteUser(userId: string): Promise<User> {
    return await this.updateUserStatus(userId, UserStatus.DELETED);
  }

  /**
   * Suspend user
   */
  async suspendUser(userId: string): Promise<User> {
    return await this.updateUserStatus(userId, UserStatus.SUSPENDED);
  }

  /**
   * Activate user
   */
  async activateUser(userId: string): Promise<User> {
    return await this.updateUserStatus(userId, UserStatus.ACTIVE);
  }

  /**
   * Get all users with pagination
   */
  async getUsers(options: {
    page?: number;
    limit?: number;
    status?: UserStatus;
    role?: UserRole;
    search?: string;
  }) {
    const { page = 1, limit = 20, status, role, search } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
   * Get user statistics
   */
  async getUserStats() {
    const [total, active, suspended, pending] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
      prisma.user.count({ where: { status: UserStatus.PENDING } }),
    ]);

    return { total, active, suspended, pending };
  }

  /**
   * Update last login time
   */
  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * Convert user to response format
   */
  toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber,
      phoneNumberVerified: user.phoneNumberVerified,
      createdAt: user.createdAt,
    };
  }
}

export const userService = new UserService();
