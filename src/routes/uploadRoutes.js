import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { uploadSingle } from '../middlewares/uploadMiddleware.js';
import * as uploadController from '../controllers/uploadController.js';

const router = Router();
router.post(
    '/',
    verifyToken,
    uploadSingle('image'),
    uploadController.uploadImage
);

export default router;