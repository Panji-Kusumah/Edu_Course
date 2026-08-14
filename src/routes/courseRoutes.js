import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';
import * as courseController from '../controllers/courseController.js';

//   Rancangan Endpoint:
//   GET/api/v1/course
//   GET/api/v1/course/:id
//   POST/api/v1/course
//   PATCH/api/v1/course/:id
//   PUT/api/v1/course/:id
//   DELETE/api/v1/course/:id

const router = Router();
const COURSE_STATUSES = ['draft', 'published', 'archived'];
const COURSE_LEVELS = ['beginner', 'intermediate', 'advanced'];

function emptyToUndefined(value) {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value === 'string' && value.trim() === '') {
        return undefined;
    }
    return value;
}

const pageSchema = z
    .preprocess(
        emptyToUndefined,
        z.coerce.number().int().positive().optional()
    )
    .default(1);
const limitSchema = z
    .preprocess(
        emptyToUndefined,
        z.coerce.number().int().positive().max(100).optional()
    )
    .default(10);

function optionalEnum(values) {
    return z.preprocess(
        emptyToUndefined,
        z.enum(values).optional()
    );
}

function optionalString(maxLength) {
    return z.preprocess(
        emptyToUndefined,
        z.string().max(maxLength).optional()
    );
}

function optionalNullableString(maxLength) {
    return z.preprocess(
        emptyToUndefined,
        z.string().max(maxLength).nullable().optional()
    );
}

// GET /api/v1/course
const listCourseQuerySchema = z
    .object({
        page: pageSchema,
        limit: limitSchema,
        status: optionalEnum(COURSE_STATUSES),
        level: optionalEnum(COURSE_LEVELS),
        category_id: z.preprocess(
            emptyToUndefined,
            z.coerce.number().int().positive().optional()
        ),
    })
    .strip();

const courseIdParamSchema = z.object({
    id: z.preprocess(
        emptyToUndefined,
        z.coerce.number().int().positive()
    ),
});

//POST /api/v1/course
const createCourseBodySchema = z
    .object({
        name: z.string().min(1).max(255),
        slug: z.preprocess(
            emptyToUndefined,
            z
                .string()
                .max(255)
                .regex(
                    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    'Slug must contain only lowercase letters, numbers, and hyphens'
                )
                .optional()
        ),
        category_id: z.coerce.number().int().positive(),
        tutor_id: z.coerce.number().int().positive(),
        description: optionalNullableString(5000),
        level: optionalEnum(COURSE_LEVELS),
        status: optionalEnum(COURSE_STATUSES),
        price: z.preprocess(
            emptyToUndefined,
            z.coerce.number().min(0).optional()
        ),
        rating: z.preprocess(
            emptyToUndefined,
            z.coerce.number().min(0).max(5).optional()
        ),
        thumbnail_url: optionalNullableString(255),
    })
    .strip();
//PATCH /api/v1/course/:id
//PUT /api/v1/course/:id
const updateCourseBodySchema = createCourseBodySchema
    .partial()
    .strip()
    .refine((body) => Object.keys(body).length > 0, {
        message: 'Update payload cannot be empty',
    });


// DELETE /api/v1/course/:id?hard=true

const deleteCourseQuerySchema = z
    .object({
        hard: z
            .preprocess(emptyToUndefined, z.enum(['true', 'false', '1', '0']).optional())
            .transform((value) => value === 'true' || value === '1'),
    })
    .strip();

//Routes
router.get(
    '/',
    validate({
        query: listCourseQuerySchema,
    }),
    courseController.getCourses
);

router.get(
    '/:id',
    validate({
        params: courseIdParamSchema,
    }),
    courseController.getCourseById
);

router.post(
    '/',
    validate({
        body: createCourseBodySchema,
    }),
    courseController.createCourse
);

router.patch(
    '/:id',
    validate({
        params: courseIdParamSchema,
        body: updateCourseBodySchema,
    }),
    courseController.updateCourse
);

router.put(
    '/:id',
    validate({
        params: courseIdParamSchema,
        body: updateCourseBodySchema,
    }),
    courseController.updateCourse
);

router.delete(
    '/:id',
    validate({
        params: courseIdParamSchema,
        query: deleteCourseQuerySchema,
    }),
    courseController.deleteCourse
);

export default router;