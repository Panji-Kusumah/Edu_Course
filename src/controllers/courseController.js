import * as courseService from '../services/courseService.js';
import {sendSuccess,sendCreated,sendUpdated,sendDeleted} from '../utils/respond.js';
import * as asyncHandlerModule from '../utils/asyncHandler.js';

const asyncHandler =
    asyncHandlerModule.default ||
    asyncHandlerModule.asyncHandler ||
    ((fn) => (req, res, next) =>
        Promise.resolve(fn(req, res, next)).catch(next));

function isHardDelete(req) {
    const query = req.validQuery ?? req.query ?? {};
    return (
        query.hard === true || query.hard === 'true' ||
        query.hard === '1' || query.hard === 1
    );
}

export const getCourses = asyncHandler(async (req, res) => {
    const query = req.validQuery ?? req.query ?? {};
    const { data, meta } = await courseService.getCourses(query);
    return sendSuccess(res, {
        statusCode: 200,
        message: 'Course list retrieved successfully',
        data,
        meta,
    });
});

export const getCourseById = asyncHandler(async (req, res) => {
    const params = req.validParams ?? req.params ?? {};
    const data = await courseService.getCourseById(params.id);
    return sendSuccess(res, {
        statusCode: 200,
        message: 'Course details retrieved successfully',
        data,
    });
});

export const createCourse = asyncHandler(async (req, res) => {
    const data = await courseService.createCourse(req.body ?? {});
    return sendCreated(res, {
        message: 'New course created successfully',
        data,
    });
});

export const updateCourse = asyncHandler(async (req, res) => {
    const params = req.validParams ?? req.params ?? {};
    const data = await courseService.updateCourse(
        params.id,
        req.body ?? {}
    );
    return sendUpdated(res, {
        message: 'Course updated successfully',
        data,
    });
});

export const deleteCourse = asyncHandler(async (req, res) => {
    const params = req.validParams ?? req.params ?? {};
    const hard = isHardDelete(req);
    const data = await courseService.deleteCourse(params.id, {
        hard,
    });
    return sendDeleted(res, {
        message: hard
            ? 'Course has been permanently deleted'
            : 'Course has been moved to trash',
        data,
    });
});