import * as databaseModule from '../config/database.js';
const pool =
    databaseModule.default ||
    databaseModule.pool ||
    databaseModule.db ||
    databaseModule.connection;
if (!pool || typeof pool.execute !== 'function') {
    throw new Error(
        'Database pool tidak ditemukan. Pastikan src/config/database.js mengekspor pool mysql2/promise.'
    );
}

const COURSE_TABLE = 'classes';
const COURSE_VIEW = 'v_course_cards';
const IMMUTABLE_COLUMNS = new Set([
    'id',
    'created_at',
    'updated_at',
    'deleted_at',
]);

const DEFAULT_COURSE_COLUMNS = new Set([
    'category_id',
    'tutor_id',
    'name',
    'slug',
    'description',
    'level',
    'status',
    'price',
    'rating',
    'thumbnail_url',
]);

let courseColumnsPromise = null;
async function getCourseColumns() {
    if (!courseColumnsPromise) {
        courseColumnsPromise = (async () => {
            try {
                const [rows] = await pool.execute(
                    `
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = :tableName
                    `,
                    {
                        tableName: COURSE_TABLE,
                    }
                );
                if (!rows || rows.length === 0) {
                    return DEFAULT_COURSE_COLUMNS;
                }
                return new Set(rows.map((row) => row.COLUMN_NAME));
            } catch {
                return DEFAULT_COURSE_COLUMNS;
            }
        })();
    }
    return courseColumnsPromise;
}
function sanitizePayload(payload, columns) {
    const entries = Object.entries(payload ?? {}).filter(
        ([key, value]) => columns.has(key) && value !== undefined
    );
    const safeEntries = entries.filter(
        ([key]) => !IMMUTABLE_COLUMNS.has(key)
    );
    return Object.fromEntries(safeEntries);
}
function buildCourseFilters(filters = {}) {
    const where = [];
    const params = {};
    const status = filters.status;
    const level = filters.level;
    const categoryId = filters.categoryId ?? filters.category_id;
    if (status) {
        where.push('status = :status');
        params.status = status;
    }
    if (level) {
        where.push('level = :level');
        params.level = level;
    }
    if (categoryId) {
        where.push('category_id = :categoryId');
        params.categoryId = categoryId;
    }
    return {
        where,
        params,
    };
}
export async function findAllCourses({
    page = 1,
    limit = 10,
    offset = 0,
    status,
    level,
    categoryId,
    category_id,
} = {}) {
    const { where, params } = buildCourseFilters({
        status,
        level,
        categoryId,
        category_id,
    });
    const whereSql = where.length > 0
        ? `WHERE ${where.join(' AND ')}`
        : '';
    const sql = `
    SELECT *
    FROM ${COURSE_VIEW}
    ${whereSql}
    ORDER BY id DESC
    LIMIT :limit OFFSET :offset
    `;
    const [rows] = await pool.execute(sql, {
        ...params,
        limit,
        offset,
    });
    return rows;
}
export async function countCourses(filters = {}) {
    const { where, params } = buildCourseFilters(filters);
    const whereSql = where.length > 0
        ? `WHERE ${where.join(' AND ')}`
        : '';
    const sql = `
    SELECT COUNT(*) AS total
    FROM ${COURSE_VIEW}
    ${whereSql}
    `;
    const [rows] = await pool.execute(sql, params);
    return Number(rows[0]?.total ?? 0);
}
export async function findCourseById(id) {
    try {
        const [viewRows] = await pool.execute(
            `
        SELECT *
        FROM ${COURSE_VIEW}
        WHERE id = :id
        LIMIT 1
        `,
            {
                id,
            }
        );
        if (viewRows.length > 0) {
            return viewRows[0];
        }
    } catch {
    }
    const [rows] = await pool.execute(
        `
        SELECT
        c.*,
        cat.name AS category_name,
        t.name AS tutor_name
        FROM ${COURSE_TABLE} c
        LEFT JOIN categories cat
        ON cat.id = c.category_id
        LEFT JOIN tutors t
        ON t.id = c.tutor_id
        WHERE c.id = :id
        AND c.deleted_at IS NULL
        LIMIT 1
    `,
        {
            id,
        }
    );
    return rows[0] ?? null;
}
export async function findActiveCourseRowById(id) {
    const [rows] = await pool.execute(
        `
        SELECT id
        FROM ${COURSE_TABLE}
        WHERE id = :id
        AND deleted_at IS NULL
        LIMIT 1
    `,
        {
            id,
        }
    );
    return rows[0] ?? null;
}

export async function createCourse(payload) {
    const columns = await getCourseColumns();
    const data = sanitizePayload(payload, columns);
    const fields = Object.keys(data);
    if (fields.length === 0) {
        const error = new Error('Tidak ada field valid untuk membuat course');
        error.statusCode = 400;
        error.status = 400;
        error.isOperational = true;
        throw error;
    }
    const columnSql = fields.map((field) => `\`${field}\``).join(', ');
    const valueSql = fields.map((field) => `:${field}`).join(', ');
    const sql = `
    INSERT INTO ${COURSE_TABLE} (${columnSql})
    VALUES (${valueSql})
    `;
    const [result] = await pool.execute(sql, data);
    return result.insertId;
}
export async function updateCourse(id, payload) {
    const columns = await getCourseColumns();
    const data = sanitizePayload(payload, columns);
    const fields = Object.keys(data);
    if (fields.length === 0) {
        return false;
    }
    const setSql = fields
        .map((field) => `\`${field}\` = :${field}`)
        .join(', ');
    const sql = `
    UPDATE ${COURSE_TABLE}
    SET ${setSql}
    WHERE id = :id
        AND deleted_at IS NULL
    `;
    const [result] = await pool.execute(sql, {
        ...data,
        id,
    });
    return result.affectedRows > 0;
}

export async function softDeleteCourse(id) {
    const [result] = await pool.execute(
        `
        UPDATE ${COURSE_TABLE}
        SET deleted_at = NOW()
        WHERE id = :id
        AND deleted_at IS NULL
    `,
        {
            id,
        }
    );
    return result.affectedRows > 0;
}

export async function hardDeleteCourse(id) {
    const [result] = await pool.execute(
        `
        DELETE FROM ${COURSE_TABLE}
        WHERE id = :id
    `,
        {
            id,
        }
    );
    return result.affectedRows > 0;
}