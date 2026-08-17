import { courseRepository } from '../repositories/courseRepository.js';
import logger from '../utils/logger.js';

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const getCourses = async (query) => {
    const { page, limit, status, level, category_id, topic, search, sortBy } = query;

    const filters = { page, limit, status, level, category_id, topic, search, sortBy };
    const { data, total } = await courseRepository.getAll(filters);

    const totalPages = Math.ceil(total / limit);

    return {
        data,
        meta: {
            pagination: {
                page,
                limit,
                totalItems: total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        },
    };
};

export const getCourseById = async (id) => {
    const course = await courseRepository.getById(id);
    if (!course) throw new AppError('Course not found', 404);
    return course;
};

export const createCourse = async (data) => {
    const course = await courseRepository.create(data);
    logger.info(`Course created: ${course.title}`);
    return course;
};

export const updateCourse = async (id, data) => {
    const existing = await courseRepository.getById(id);
    if (!existing) throw new AppError('Course not found', 404);

    const course = await courseRepository.update(id, data);
    logger.info(`Course updated: ${course.title}`);
    return course;
};

export const deleteCourse = async (id, options) => {
    const existing = await courseRepository.getById(id);
    if (!existing) throw new AppError('Course not found', 404);

    if (options.hard) {
        await courseRepository.hardDelete(id);
        logger.info(`Course hard deleted: ${id}`);
        return { id: Number(id), hard_deleted: true };
    }

    await courseRepository.softDelete(id);
    logger.info(`Course soft deleted: ${id}`);
    return { id: Number(id), hard_deleted: false };
};