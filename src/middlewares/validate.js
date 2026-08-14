import { ZodError } from 'zod';

function formatZodError(zodError) {
    return zodError.issues.map((issue) => {
        return {
            field: issue.path.join('.') || 'request',
            message: issue.message,
            code: issue.code,
        };
    });
}

function createValidationError(details) {
    const error = new Error('Request validation failed');
    error.statusCode = 400;
    error.status = 400;
    error.code = 'ERR_VALIDATION';
    error.isOperational = true;
    error.details = details;
    return error;
}
export function validate(schemas = {}) {
    return (req, res, next) => {
        try {
            if (schemas.params) {
                req.validParams = schemas.params.parse(req.params || {});
            } else {
                req.validParams = req.params || {};
            }
            if (schemas.query) {
                req.validQuery = schemas.query.parse(req.query || {});
            } else {
                req.validQuery = req.query || {};
            }
            if (schemas.body) {
                req.body = schemas.body.parse(req.body ?? {});
            }
            req.valid = {
                params: req.validParams,
                query: req.validQuery,
                body: req.body,
            };
            return next();
        } catch (error) {
            if (error instanceof ZodError) {
                return next(createValidationError(formatZodError(error)));
            }
            return next(error);
        }
    };
}