import { Router } from 'express';
import courseRoutes from './courseRoutes.js';
import authRoutes from './authRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import { sendSuccess } from '../utils/respond.js';

const router = Router();

router.get('/', (req, res) => {
    return sendSuccess(res, {
        statusCode: 200,
        message: 'Edu Course API is active',
        data: {
            name: 'Edu Course API',
            version: 'v1',
        },
        meta: {
            endpoints: {
                health: '/api/v1/health',
                course: '/api/v1/course',
                auth: '/api/v1/login, /api/v1/register, /api/v1/verify-email, /api/v1/me',
                upload: '/api/v1/upload',
            },
        },
    });
});

router.get('/health', (req, res) => {
    return sendSuccess(res, {
        statusCode: 200,
        message: 'API service is healthy',
        data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
        },
    });
});

router.use('/', authRoutes);
router.use('/course', courseRoutes);
router.use('/upload', uploadRoutes);
export default router;