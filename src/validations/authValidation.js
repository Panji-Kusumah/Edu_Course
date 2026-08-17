import { z } from 'zod';

// Schema untuk Register
export const registerSchema = z.object({
    fullname: z.string({ required_error: 'Fullname is required' })
        .min(3, 'Fullname must be at least 3 characters long')
        .max(100, 'Fullname is too long'),
    username: z.string({ required_error: 'Username is required' })
        .min(3, 'Username must be at least 3 characters long')
        .max(50, 'Username is too long')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string({ required_error: 'Email is required' })
        .email('Invalid email format')
        .max(100, 'Email is too long'),
    password: z.string({ required_error: 'Password is required' })
        .min(6, 'Password must be at least 6 characters long')
});

// Schema untuk Login
export const loginSchema = z.object({
    email: z.string({ required_error: 'Email is required' })
        .email('Invalid email format'),
    password: z.string({ required_error: 'Password is required' })
        .min(1, 'Password is required')
});

// Schema untuk query param verify-email
export const verifyEmailQuerySchema = z.object({
    token: z.string({ required_error: 'Token is required' })
        .min(1, 'Token is required')
});