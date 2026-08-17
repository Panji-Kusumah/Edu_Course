import { z } from 'zod';

export const courseParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Course ID must be a valid number'),
});

export const courseQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    category_id: z.coerce.number().int().positive().optional(),
    topic: z.string().min(1).optional(),
    search: z.string().min(1).optional(),
    sortBy: z
        .enum(['newest', 'oldest', 'price_asc', 'price_desc', 'rating', 'title_asc'])
        .default('newest'),
    hard: z.union([z.boolean(), z.string(), z.number()]).optional(),
});

export const createCourseSchema = z.object({
    tutor_id: z.number({ required_error: 'Tutor ID is required' }).int().positive(),
    category_id: z.number({ required_error: 'Category ID is required' }).int().positive(),
    title: z.string({ required_error: 'Title is required' }).min(3).max(150),
    description: z.string().optional(),
    price: z.number({ required_error: 'Price is required' }).min(0),
    discount_percent: z.number().int().min(0).max(100).default(0),
    level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    thumbnail: z.string().optional(),
    language: z.string().max(50).default('Indonesia'),
    includes_certificate: z.boolean().default(true),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export const updateCourseSchema = createCourseSchema.partial();