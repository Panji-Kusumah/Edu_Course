import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import {
    courseParamsSchema,
    courseQuerySchema,
    createCourseSchema,
    updateCourseSchema,
} from '../validations/courseValidation.js';
import * as courseController from '../controllers/courseController.js';

const router = Router();

router.get(
    '/',
    validate({ query: courseQuerySchema }),
    courseController.getCourses
);

router.get(
    '/:id',
    validate({ params: courseParamsSchema }),
    courseController.getCourseById
);

router.post(
    '/',
    validate({ body: createCourseSchema }),
    courseController.createCourse
);

router.patch(
    '/:id',
    validate({ params: courseParamsSchema, body: updateCourseSchema }),
    courseController.updateCourse
);

router.put(
    '/:id',
    validate({ params: courseParamsSchema, body: createCourseSchema }),
    courseController.updateCourse
);

router.delete(
    '/:id',
    validate({ params: courseParamsSchema }),
    courseController.deleteCourse
);

export default router;