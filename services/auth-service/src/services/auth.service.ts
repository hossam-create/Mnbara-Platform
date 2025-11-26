import { PrismaClient, User, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export class AuthService {
    // Generate JWT Token
    private generateToken(userId: number, role: UserRole): string {
        return jwt.sign(
            { id: userId, role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );
    }

    // Register User
    async register(data: any) {
        const { email, password, firstName, lastName, role = 'USER' } = data;

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
                role: role as UserRole,
            },
        });

        // Generate token
        const token = this.generateToken(user.id, user.role);

        return { user, token };
    }

    // Login User
    async login(data: any) {
        const { email, password } = data;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.password) {
            throw new Error('Invalid credentials');
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        // Generate token
        const token = this.generateToken(user.id, user.role);

        return { user, token };
    }

    // Get User Profile
    async getProfile(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                wallet: true,
                listings: { take: 5 },
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Remove password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}
