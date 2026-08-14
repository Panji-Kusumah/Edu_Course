import { Router } from 'express';
import courseRoutes from './courseRoutes.js';
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
            },
        },
    });
});

//health cek
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

router.use('/course', courseRoutes);
export default router;