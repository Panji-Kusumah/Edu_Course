import { sendSuccess } from '../utils/respond.js';
import * as asyncHandlerModule from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';

const asyncHandler =
    asyncHandlerModule.default ||
    asyncHandlerModule.asyncHandler ||
    ((fn) => (req, res, next) =>
        Promise.resolve(fn(req, res, next)).catch(next));

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const uploadImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppError('No file uploaded. Please select an image file.', 400);
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    logger.info(`File uploaded successfully: ${req.file.filename}`);
    return sendSuccess(res, {
        statusCode: 200,
        message: 'File uploaded successfully',
        data: {
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            url: fileUrl,
        },
    });
});