import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { User, RegisterDto, LoginDto, UserRole, UserStatus } from '../types/auth.types';

export class AuthService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async register(data: RegisterDto): Promise<Omit<User, 'password'>> {
    logger.info(`Registering user: ${data.email}`);
    
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create new user
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password, // In production, this should be hashed
        name: data.name,
        role: UserRole.USER,
        status: UserStatus.ACTIVE
      }
    });

    logger.info(`User registered successfully: ${user.id}`);

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'password'>;
  }

  async login(data: LoginDto): Promise<User | null> {
    logger.info(`Login attempt for: ${data.email}`);

    const user = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      logger.warn(`Login failed: User not found - ${data.email}`);
      return null;
    }

    if (user.status !== UserStatus.ACTIVE) {
      logger.warn(`Login failed: User inactive - ${data.email}`);
      return null;
    }

    // In production, compare hashed passwords
    if (user.password !== data.password) {
      logger.warn(`Login failed: Invalid password - ${data.email}`);
      return null;
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    logger.info(`Login successful: ${user.id}`);
    return user;
  }

  async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'password'>;
  }

  async updateUser(id: string, data: Partial<User>): Promise<Omit<User, 'password'>> {
    logger.info(`Updating user: ${id}`);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'password'>;
  }

  async deleteUser(id: string): Promise<void> {
    logger.info(`Deleting user: ${id}`);

    await this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.DELETED,
        updatedAt: new Date()
      }
    });

    logger.info(`User deleted: ${id}`);
  }

  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt
      }
    });
  }

  async validateRefreshToken(token: string): Promise<string | null> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token }
    });

    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      return null;
    }

    return refreshToken.userId;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.delete({
      where: { token }
    }).catch(() => {
      // Token might not exist, ignore
    });
  }
}
