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
                message: 'Data duplikat terdeteksi',
            },
        ];
    }
    const [, value, key] = match;
    const field = key.split('.').pop() || key;
    return [
        {
            field,
            value,
            message: `Nilai '${value}' sudah digunakan pada field '${field}'`,
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
        `Route ${req.method} ${req.originalUrl} tidak ditemukan`
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
    let message = err.message || 'Terjadi kesalahan pada server';
    let details = err.details;
    if (
        err.type === 'entity.parse.failed' ||
        (err instanceof SyntaxError && 'body' in err)
    ) {
        statusCode = 400;
        message = 'Format JSON tidak valid';
        details = [
            {
                field: 'body',
                message: 'Body request harus berupa JSON yang valid',
            },
        ];
    }
    if (err.code) {
        if (err.code === 'ER_DUP_ENTRY') {
            statusCode = 409;
            message = 'Data sudah ada atau melanggar unique constraint';
            details = extractDuplicateEntryDetails(err);
        }
        if (
            err.code === 'ER_NO_REFERENCED_ROW' ||
            err.code === 'ER_NO_REFERENCED_ROW_2'
        ) {
            statusCode = 400;
            message = 'Data terkait tidak ditemukan atau tidak valid';
            details = buildMySQLDetails(err);
        }
        if (
            err.code === 'ER_ROW_IS_REFERENCED' ||
            err.code === 'ER_ROW_IS_REFERENCED_2'
        ) {
            statusCode = 409;
            message =
                'Data tidak dapat dihapus atau diperbarui karena masih digunakan oleh data lain';
            details = buildMySQLDetails(err);
        }
        if (
            err.code === 'ER_CHECK_CONSTRAINT_VIOLATION' ||
            err.errno === 3819
        ) {
            statusCode = 422;
            message = 'Data tidak memenuhi aturan validasi database';
            details = buildMySQLDetails(err);
        }
        if (
            err.code === 'ER_TRUNCATED_WRONG_VALUE' ||
            err.code === 'WARN_DATA_TRUNCATED' ||
            err.code === 'ER_DATA_TOO_LONG'
        ) {
            statusCode = 400;
            message = 'Format atau panjang data tidak valid';
            details = buildMySQLDetails(err);
        }
    }
    if (statusCode >= 500 && isProduction) {
        message = 'Terjadi kesalahan pada server';
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