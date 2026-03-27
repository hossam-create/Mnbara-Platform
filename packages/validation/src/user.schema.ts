import { z } from 'zod';

export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  dateOfBirth: z.string().refine((val) => { const date = new Date(val); const now = new Date(); return date < now && date.getFullYear() > 1900; }, 'Invalid date of birth'),
  agreedToTerms: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms' }) }),
});

export type UserRegistration = z.infer<typeof userRegistrationSchema>;

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export type UserLogin = z.infer<typeof userLoginSchema>;

export const userProfileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
});

export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>;

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export type PasswordChange = z.infer<typeof passwordChangeSchema>;

export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code'),
  country: z.string().length(2, 'Invalid country code'),
  isDefault: z.boolean().optional(),
});

export type Address = z.infer<typeof addressSchema>;
