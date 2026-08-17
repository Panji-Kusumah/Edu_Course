import { v4 as uuidv4 } from 'uuid';
import { userRepository } from '../repositories/userRepository.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken } from '../utils/jwt.js';
import { sendEmail } from '../config/mailer.js';
import logger from '../utils/logger.js';
import AppError from '../utils/AppError.js';

export const authService = {
    register: async (payload) => {
        const { fullname, username, email, password } = payload;
        const existingEmail = await userRepository.findByEmail(email);
        if (existingEmail) {
            throw new AppError(409, 'Email already registered');
        }
        const existingUsername =
            await userRepository.findByUsername(username);
        if (existingUsername) {
            throw new AppError(409, 'Username already taken');
        }
        const hashedPassword = await hashPassword(password);
        const verificationToken = uuidv4();
        const newUser = await userRepository.create({
            name: fullname,
            username,
            email,
            password: hashedPassword,
            role: 'student',
            auth_provider: 'local',
            verification_token: verificationToken,
            is_verified: false,
        });
        const verificationUrl =
            `${process.env.APP_URL || 'http://localhost:3000'}` +
            `/api/v1/verify-email?token=${verificationToken}`;
        try {
            await sendEmail({
                to: email,
                subject: 'Verify your EduCourse Account',
                html: `
                    <h2>Welcome to EduCourse, ${fullname}!</h2>
                    <p>Please click the link below to verify your email address:</p>
                    <a href="${verificationUrl}">
                        Verify your email
                    </a>
                `,
            });
        } catch (error) {
            logger.error({
                message: 'Failed to send verification email',
                stack: error.stack,
                email,
            });
            throw new AppError(
                500,
                'Account created, but verification email could not be sent'
            );
        }
        logger.info(`User registered successfully: ${email}`);
        return {
            user_id: newUser.user_id,
            name: newUser.name,
            username: newUser.username,
            email: newUser.email,
            is_verified: newUser.is_verified,
        };
    },

    // Login User
    login: async (payload) => {
        const { email, password } = payload;
        const user = await userRepository.findByEmail(email);
        if (!user) {
            throw new AppError(401, 'Invalid email or password');
        }
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            throw new AppError(401, 'Invalid email or password');
        }
        if (!user.is_verified) {
            throw new AppError(
                403,
                'Please verify your email before logging in'
            );
        }
        const token = generateToken({
            user_id: user.user_id,
            email: user.email,
            role: user.role,
        });
        logger.info(`User logged in successfully: ${email}`);
        return {
            token,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    },
    // Verify Email
    verifyEmail: async (token) => {
        const user =
            await userRepository.findByVerificationToken(token);
        if (!user) {
            throw new AppError(400, 'Invalid verification token');
        }
        await userRepository.markVerified(user.user_id);
        logger.info(`Email verified successfully for: ${user.email}`);
    },
};