function cleanPayload(payload) {
    return Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
    );
}

export function sendSuccess(
    res,
    {
        statusCode = 200,
        message = 'OK',
        data,
        meta,
    } = {}
) {
    return res
        .status(statusCode)
        .json(
            cleanPayload({
                success: true,
                message,
                data,
                meta,
            })
        );
}

export function sendCreated(
    res,
    {
        message = 'Data created successfully',
        data,
        meta,
    } = {}
) {
    return sendSuccess(res, {
        statusCode: 201,
        message,
        data,
        meta,
    });
}

export function sendUpdated(
    res,
    {
        message = 'Data updated successfully',
        data,
        meta,
    } = {}
) {
    return sendSuccess(res, {
        statusCode: 200,
        message,
        data,
        meta,
    });
}

export function sendDeleted(
    res,
    {
        message = 'Data deleted successfully',
        data,
        meta,
    } = {}
) {
    return sendSuccess(res, {
        statusCode: 200,
        message,
        data,
        meta,
    });
}

export function sendError(
    res,
    {
        statusCode = 500,
        message = 'An internal server error occurred',
        details,
    } = {}
) {
    return res
        .status(statusCode)
        .json(
            cleanPayload({
                success: false,
                message,
                details,
            })
        );
}