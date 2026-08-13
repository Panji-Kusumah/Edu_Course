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
    const error = new Error('Validasi request gagal');
    error.statusCode = 400;
    error.status = 400;
    error.code = 'ERR_VALIDATION';
    error.isOperational = true;
    error.details = details;
    return error;
}

export function validate(schemas = {}) {
    return async (req, res, next) => {
        try {
            if (schemas.params) {
                req.params = await schemas.params.parseAsync(req.params || {});
            }
            if (schemas.query) {
                req.query = await schemas.query.parseAsync(req.query || {});
            }
            if (schemas.body) {
                req.body = await schemas.body.parseAsync(req.body ?? {});
            }
            req.valid = {
                params: req.params,
                query: req.query,
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