const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function toInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function parsePagination(query = {}, options = {}) {
    const {
        defaultLimit = DEFAULT_LIMIT,
        maxLimit = MAX_LIMIT,
    } = options;
    const page = Math.max(toInt(query.page, DEFAULT_PAGE), 1);
    const limit = Math.min(
        Math.max(toInt(query.limit, defaultLimit), 1),
        maxLimit
    );
    const offset = (page - 1) * limit;
    return {
        page,
        limit,
        offset,
    };
}
export function buildPaginationMeta({ page, limit, totalItems = 0 }) {
    const total = Math.max(toInt(totalItems, 0), 0);
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    return {
        pagination: {
            page,
            limit,
            totalItems: total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
}