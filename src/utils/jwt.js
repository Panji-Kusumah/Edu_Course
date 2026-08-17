import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

export const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN || '1d' });
};

export const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};