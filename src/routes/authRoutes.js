import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import {
    registerSchema,
    loginSchema,
    verifyEmailQuerySchema,
} from '../validations/authValidation.js';
import * as authController from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.post(
    '/register',
    validate({ body: registerSchema }),
    authController.register
);

router.post(
    '/login',
    validate({ body: loginSchema }),
    authController.login
);

router.get(
    '/verify-email',
    validate({ query: verifyEmailQuerySchema }),
    authController.verifyEmail
);

// Demo endpoint untuk testing auth middleware
router.get('/me', verifyToken, authController.getMe);

export default router;