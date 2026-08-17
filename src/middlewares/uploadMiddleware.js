import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    logger.info(`Created upload directory at: ${uploadDir}`);
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Format: timestamp-random.ext (hindari nama file duplikat)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    },
});


const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        const err = new Error(
            'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
        );
        err.statusCode = 400;
        cb(err, false);
    }
};
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    },
});

export const uploadSingle = (fieldName = 'image') => {
    return (req, res, next) => {
        upload.single(fieldName)(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    const sizeErr = new Error('File size exceeds 5MB limit.');
                    sizeErr.statusCode = 400;
                    return next(sizeErr);
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                    const countErr = new Error('Too many files. Maximum 1 file per request.');
                    countErr.statusCode = 400;
                    return next(countErr);
                }
                const genericErr = new Error(`Upload error: ${err.message}`);
                genericErr.statusCode = 400;
                return next(genericErr);
            }
            if (err) {
                return next(err);
            }
            return next();
        });
    };
};