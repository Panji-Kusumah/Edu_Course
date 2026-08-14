import * as courseRepository from '../repositories/courseRepository.js';

import {
    parsePagination,
    buildPaginationMeta,
} from '../utils/pagination.js';

function createHttpError(statusCode, message, details) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.status = statusCode;
    error.isOperational = true;
    if (details) {
        error.details = details;
    }
    return error;
}

function normalizeSlug(value) {
    return String(value ?? '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function generateSlugFromName(name) {
    const base = normalizeSlug(name);
    if (!base) {
        return `course-${Date.now().toString(36)}`;
    }
    return base;
}

function normalizeCoursePayload(payload = {}) {
    const {
        categoryId,
        category_id,
        tutorId,
        tutor_id,
        thumbnailUrl,
        thumbnail_url,
        ...rest
    } = payload;
    const normalized = { ...rest };
    const finalCategoryId = categoryId ?? category_id;
    const finalTutorId = tutorId ?? tutor_id;
    const finalThumbnailUrl = thumbnailUrl ?? thumbnail_url;
    if (finalCategoryId !== undefined) {
        normalized.category_id = finalCategoryId;
    }
    if (finalTutorId !== undefined) {
        normalized.tutor_id = finalTutorId;
    }
    if (finalThumbnailUrl !== undefined) {
        normalized.thumbnail_url = finalThumbnailUrl;
    }
    return Object.fromEntries(
        Object.entries(normalized).filter(([, value]) => value !== undefined)
    );
}

export async function getCourses(query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const filters = {
        status: query.status,
        level: query.level,
        categoryId: query.category_id ?? query.categoryId,
    };
    const [courses, totalItems] = await Promise.all([
        courseRepository.findAllCourses({
            page,
            limit,
            offset,
            ...filters,
        }),
        courseRepository.countCourses(filters),
    ]);
    const meta = buildPaginationMeta({
        page,
        limit,
        totalItems,
    });
    const activeFilters = {};
    if (filters.status) {
        activeFilters.status = filters.status;
    }
    if (filters.level) {
        activeFilters.level = filters.level;
    }
    if (filters.categoryId) {
        activeFilters.category_id = filters.categoryId;
    }
    if (Object.keys(activeFilters).length > 0) {
        meta.filters = activeFilters;
    }
    return {
        data: courses,
        meta,
    };
}

export async function getCourseById(id) {
    const courseId = Number(id);
    if (!Number.isInteger(courseId) || courseId <= 0) {
        throw createHttpError(400, 'ID parameter must be a positive integer');
    }
    const course = await courseRepository.findCourseById(courseId);
    if (!course) {
        throw createHttpError(404, 'Course not found');
    }
    return course;
}

export async function createCourse(payload = {}) {
    let data = normalizeCoursePayload(payload);
    if (data.slug) {
        data.slug = normalizeSlug(data.slug);
    }
    if (!data.slug && data.name) {
        data.slug = generateSlugFromName(data.name);
    }
    if (data.status === undefined) {
        data.status = 'draft';
    }
    if (data.level === undefined) {
        data.level = 'beginner';
    }
    if (data.price === undefined) {
        data.price = 0;
    }
    if (data.category_id !== undefined) {
        data.category_id = Number(data.category_id);
    }
    if (data.tutor_id !== undefined) {
        data.tutor_id = Number(data.tutor_id);
    }
    if (data.price !== undefined) {
        data.price = Number(data.price);
    }
    if (data.rating !== undefined) {
        data.rating = Number(data.rating);
    }
    const insertId = await courseRepository.createCourse(data);
    const course = await courseRepository.findCourseById(insertId);
    return course || { id: insertId };
}

export async function updateCourse(id, payload = {}) {
    const courseId = Number(id);
    if (!Number.isInteger(courseId) || courseId <= 0) {
        throw createHttpError(400, 'ID parameter must be a positive integer');
    }
    const existing = await courseRepository.findActiveCourseRowById(courseId);
    if (!existing) {
        throw createHttpError(404, 'Course not found');
    }
    const data = normalizeCoursePayload(payload);
    if (Object.keys(data).length === 0) {
        throw createHttpError(400, 'No valid fields provided for update');
    }
    if (data.slug) {
        data.slug = normalizeSlug(data.slug);
    }
    if (data.category_id !== undefined) {
        data.category_id = Number(data.category_id);
    }
    if (data.tutor_id !== undefined) {
        data.tutor_id = Number(data.tutor_id);
    }
    if (data.price !== undefined) {
        data.price = Number(data.price);
    }
    if (data.rating !== undefined) {
        data.rating = Number(data.rating);
    }
    const updated = await courseRepository.updateCourse(courseId, data);
    if (!updated) {
        throw createHttpError(
            400,
            'No valid changes applied to the course'
        );
    }
    const course = await courseRepository.findCourseById(courseId);
    if (!course) {
        throw createHttpError(404, 'Updated course not found');
    }
    return course;
}

export async function deleteCourse(id, { hard = false } = {}) {
    const courseId = Number(id);
    if (!Number.isInteger(courseId) || courseId <= 0) {
        throw createHttpError(400, 'Invalid ID parameter: must be a positive integer');
    }
    if (!hard) {
        const existing = await courseRepository.findActiveCourseRowById(courseId);
        if (!existing) {
            throw createHttpError(404, 'Course not found');
        }
        const deleted = await courseRepository.softDeleteCourse(courseId);
        if (!deleted) {
            throw createHttpError(500, 'Unable to soft delete the specified course');
        }
        return {
            id: courseId,
            hard: false,
        };
    }
    const deleted = await courseRepository.hardDeleteCourse(courseId);
    if (!deleted) {
        throw createHttpError(404, 'Course not found');
    }
    return {
        id: courseId,
        hard: true,
    };
}