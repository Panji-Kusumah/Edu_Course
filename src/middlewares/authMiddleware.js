import { verifyToken as verifyJWT } from '../utils/jwt.js'; // 👈 Gunakan alias 'verifyJWT'
import logger from '../utils/logger.js';

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const verifyToken = (req, res, next) => {
    try {
        // 1. Ambil token dari header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('Access denied. No token provided or invalid format.', 401);
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw new AppError('Access denied. Token is empty.', 401);
        }

        // 2. Verifikasi token menggunakan fungsi dari utils/jwt.js (yang di-alias ke verifyJWT)
        const decoded = verifyJWT(token);

        // 3. Attach user info ke request object
        req.user = {
            user_id: decoded.user_id,
            email: decoded.email,
            role: decoded.role,
        };

        logger.info(`Token verified for user: ${decoded.email}`);

        return next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid token. Access denied.', 401));
        }

        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Token has expired. Please login again.', 401));
        }

        return next(error);
    }
};

export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Authentication required.', 401));
        }
        if (!roles.includes(req.user.role)) {
            logger.warn(
                `Unauthorized access attempt by user ${req.user.email} (role: ${req.user.role})`
            );
            return next(
                new AppError('You do not have permission to perform this action.', 403)
            );
        }
        return next();
    };
};