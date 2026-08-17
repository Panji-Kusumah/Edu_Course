import { authService } from '../services/authService.js';
import { sendSuccess, sendCreated } from '../utils/respond.js';
import asyncHandler from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
    const payload = req.valid.body;
    const data = await authService.register(payload);
    return sendCreated(res, {
        message:
            'Registration successful. Please check your email to verify your account.',
        data,
    });
});

export const login = asyncHandler(async (req, res) => {
    const payload = req.valid.body;

    const data = await authService.login(payload);

    return sendSuccess(res, {
        message: 'Login successful',
        data,
    });
});

export const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.validQuery;

    await authService.verifyEmail(token);

    return sendSuccess(res, {
        message: 'Email verified successfully',
    });
});

// Demo endpoint untuk testing auth middleware
export const getMe = asyncHandler(async (req, res) => {
    return sendSuccess(res, {
        message: 'User profile retrieved successfully',
        data: req.user,
    });
});