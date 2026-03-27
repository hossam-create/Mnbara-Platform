import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: { email: string; password?: string; name?: string; phoneNumber?: string }) {
    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null;
    const user = await this.prisma.user.create({
      data: { email: data.email, password: hashedPassword, name: data.name, phoneNumber: data.phoneNumber },
    });
    this.logger.log(`User created: ${user.id}`);
    return user;
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateUser(userId: string, data: any) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  async updateUserStatus(userId: string, status: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { status } as any });
  }

  async verifyEmail(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { emailVerified: true } as any });
  }

  async verifyPhoneNumber(userId: string, phoneNumber: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { phoneNumber, phoneNumberVerified: true } as any });
  }

  async updatePassword(userId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
  }

  async deleteUser(userId: string) {
    return this.updateUserStatus(userId, 'DELETED');
  }

  async suspendUser(userId: string) {
    return this.updateUserStatus(userId, 'SUSPENDED');
  }

  async activateUser(userId: string) {
    return this.updateUserStatus(userId, 'ACTIVE');
  }

  async getUsers(options: { page?: number; limit?: number; status?: string; role?: string; search?: string }) {
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
      this.prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);
    return { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getUserStats() {
    const [total, active, suspended, pending] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } as any }),
      this.prisma.user.count({ where: { status: 'SUSPENDED' } as any }),
      this.prisma.user.count({ where: { status: 'PENDING' } as any }),
    ]);
    return { total, active, suspended, pending };
  }

  async updateLastLogin(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } as any });
  }
}
