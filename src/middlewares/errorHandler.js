import { sendError } from '../utils/respond.js';

const isProduction = process.env.NODE_ENV === 'production';
function normalizeStatusCode(value) {
    const code = Number(value);
    if (Number.isInteger(code) && code >= 400 && code <= 599) {
        return code;
    }
    return 500;
}

function extractDuplicateEntryDetails(error) {
    const sqlMessage = error.sqlMessage || error.message || '';
    const match = sqlMessage.match(
        /Duplicate entry '(.+?)' for key '(.+?)'/
    );
    if (!match) {
        return [
            {
                message: 'Duplicate data detected',
            },
        ];
    }
    const [, value, key] = match;
    const field = key.split('.').pop() || key;
    return [
        {
            field,
            value,
            message: `The value '${value}' is already in use for field '${field}'`,
        },
    ];
}

function buildMySQLDetails(error) {
    if (error.details) {
        return error.details;
    }
    if (error.sqlMessage) {
        return [
            {
                message: error.sqlMessage,
            },
        ];
    }
    return undefined;
}
export function notFoundHandler(req, res, next) {
    const error = new Error(
        `Route ${req.method} ${req.originalUrl} not found`
    );
    error.statusCode = 404;
    error.status = 404;
    error.isOperational = true;
    return next(error);
}
export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    let statusCode = normalizeStatusCode(err.statusCode || err.status);
    let message = err.message || 'An unexpected error occurred while processing your request';
    let details = err.details;
    if (
        err.type === 'entity.parse.failed' ||
        (err instanceof SyntaxError && 'body' in err)
    ) {
        statusCode = 400;
        message = 'Failed to parse request body: Invalid JSON format';
        details = [
            {
                field: 'body',
                message: 'Request body must be a valid JSON',
            },
        ];
    }
    if (err.code) {
        if (err.code === 'ER_DUP_ENTRY') {
            statusCode = 409;
            message = 'Data already exists or violates a unique constraint';
            details = extractDuplicateEntryDetails(err);
        }
        if (
            err.code === 'ER_NO_REFERENCED_ROW' ||
            err.code === 'ER_NO_REFERENCED_ROW_2'
        ) {
            statusCode = 400;
            message = 'Related data not found or invalid';
            details = buildMySQLDetails(err);
        }
        if (
            err.code === 'ER_ROW_IS_REFERENCED' ||
            err.code === 'ER_ROW_IS_REFERENCED_2'
        ) {
            statusCode = 409;
            message =
                'Data cannot be deleted or updated because it is referenced by other records';
            details = buildMySQLDetails(err);
        }
        if (
            err.code === 'ER_CHECK_CONSTRAINT_VIOLATION' ||
            err.errno === 3819
        ) {
            statusCode = 422;
            message = 'Data does not satisfy database validation rules';
            details = buildMySQLDetails(err);
        }
        if (
            err.code === 'ER_TRUNCATED_WRONG_VALUE' ||
            err.code === 'WARN_DATA_TRUNCATED' ||
            err.code === 'ER_DATA_TOO_LONG'
        ) {
            statusCode = 400;
            message = 'Invalid data format or length';
            details = buildMySQLDetails(err);
        }
    }
    if (statusCode >= 500 && isProduction) {
        message = 'An internal server error occurred';
        details = undefined;
    }
    console.error('[ErrorHandler]', {
        statusCode,
        code: err.code,
        errno: err.errno,
        message: err.message,
        details,
    });
    return sendError(res, {
        statusCode,
        message,
        details,
    });
}