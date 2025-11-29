import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthController {
    // Register
    async register(req: Request, res: Response) {
        try {
            const { email, password, firstName, lastName } = req.body;

            // Check if user exists
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    role: 'BUYER' // Default role
                }
            });

            // Generate token
            const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });

            res.status(201).json({ token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Login
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            // Find user
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user || !user.password) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Check password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Generate token
            const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });

            res.json({ token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Google Auth
    async googleAuth(req: Request, res: Response) {
        res.json({ message: 'Google auth endpoint' });
    }

    async googleCallback(req: Request, res: Response) {
        res.json({ message: 'Google callback endpoint' });
    }

    // Apple Auth
    async appleAuth(req: Request, res: Response) {
        res.json({ message: 'Apple auth endpoint' });
    }

    async appleCallback(req: Request, res: Response) {
        res.json({ message: 'Apple callback endpoint' });
    }

    // Refresh Token
    async refreshToken(req: Request, res: Response) {
        res.json({ message: 'Refresh token endpoint' });
    }

    // Logout
    async logout(req: Request, res: Response) {
        res.json({ message: 'Logout successful' });
    }

    // Get current user
    async getCurrentUser(req: Request, res: Response) {
        res.json({ message: 'Get current user' });
    }
}
