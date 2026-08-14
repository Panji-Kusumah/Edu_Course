import * as databaseModule from '../config/database.js';

const pool =
    databaseModule.default ||
    databaseModule.pool ||
    databaseModule.db ||
    databaseModule.connection;

if (!pool || typeof pool.query !== 'function') {
    throw new Error(
        'Failed to initialize database connection. Invalid pool configuration'
    );
}

const COURSE_TABLE = 'classes';
const COURSE_VIEW = 'v_course_cards';
const DEFAULT_COURSE_COLUMNS = new Set([
    'class_id',
    'category_id',
    'tutor_id',
    'name',
    'title',
    'slug',
    'description',
    'level',
    'status',
    'price',
    'discount_percent',
    'rating',
    'thumbnail',
    'thumbnail_url',
]);

let courseColumnsPromise = null;
let coursePrimaryKeyPromise = null;

async function runQuery(sql, params = {}) {
    const hasParams = Object.keys(params).length > 0;
    if (!hasParams) {
        return pool.query(sql);
    }
    return pool.query(
        {
            sql,
            namedPlaceholders: true,
        },
        params
    );
}

async function getCourseColumns() {
    if (!courseColumnsPromise) {
        courseColumnsPromise = (async () => {
            try {
                const [rows] = await runQuery(
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

async function getCoursePrimaryKey() {
    if (!coursePrimaryKeyPromise) {
        coursePrimaryKeyPromise = (async () => {
            try {
                const [rows] = await runQuery(
                    `
                        SELECT COLUMN_NAME
                        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                        WHERE TABLE_SCHEMA = DATABASE()
                        AND TABLE_NAME = :tableName
                        AND CONSTRAINT_NAME = 'PRIMARY'
                        LIMIT 1
                    `,
                    {
                        tableName: COURSE_TABLE,
                    }
                );
                if (rows?.[0]?.COLUMN_NAME) {
                    return rows[0].COLUMN_NAME;
                }
            } catch {
            }
            const columns = await getCourseColumns();
            if (columns.has('id')) {
                return 'id';
            }
            if (columns.has('class_id')) {
                return 'class_id';
            }
            return 'id';
        })();
    }
    return coursePrimaryKeyPromise;
}

function sanitizePayload(payload, columns, primaryKey) {
    const immutableColumns = new Set([
        'id',
        'class_id',
        'created_at',
        'updated_at',
        'deleted_at',
        primaryKey,
    ]);
    const entries = Object.entries(payload ?? {}).filter(
        ([key, value]) => columns.has(key) && value !== undefined
    );
    const safeEntries = entries.filter(
        ([key]) => !immutableColumns.has(key)
    );
    return Object.fromEntries(safeEntries);
}

function buildCourseFilters(filters = {}, columns = new Set()) {
    const where = [];
    const params = {};
    const status = filters.status;
    const level = filters.level;
    const categoryId = filters.categoryId ?? filters.category_id;
    if (status && columns.has('status')) {
        where.push('status = :status');
        params.status = status;
    }
    if (level && columns.has('level')) {
        where.push('level = :level');
        params.level = level;
    }
    if (categoryId && columns.has('category_id')) {
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
    const [columns, primaryKey] = await Promise.all([
        getCourseColumns(),
        getCoursePrimaryKey(),
    ]);
    const { where, params } = buildCourseFilters(
        {
            status,
            level,
            categoryId,
            category_id,
        },
        columns
    );
    const whereSql = where.length > 0
        ? `WHERE ${where.map((w) => `c.${w}`).join(' AND ')}`
        : '';
    const safeLimit = Math.max(1, Math.floor(Number(limit) || 10));
    const safeOffset = Math.max(0, Math.floor(Number(offset) || 0));
    const sql = `
        SELECT v.*
        FROM ${COURSE_TABLE} c
        JOIN ${COURSE_VIEW} v
        ON c.${primaryKey} = v.class_id
        ${whereSql}
        ORDER BY c.${primaryKey} ASC
        LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;
    const [rows] = await runQuery(sql, params);
    return rows;
}

export async function countCourses(filters = {}) {
    const columns = await getCourseColumns();
    const { where, params } = buildCourseFilters(filters, columns);
    const whereSql = where.length > 0
        ? `WHERE ${where.map((w) => `c.${w}`).join(' AND ')}`
        : '';
    const sql = `
        SELECT COUNT(*) AS total
        FROM ${COURSE_TABLE} c
        ${whereSql}
    `;

    const [rows] = await runQuery(sql, params);

    return Number(rows[0]?.total ?? 0);
}

export async function findCourseById(id) {
    const [columns, primaryKey] = await Promise.all([
        getCourseColumns(),
        getCoursePrimaryKey(),
    ]);

    const softDeleteCondition = columns.has('deleted_at')
        ? 'AND c.deleted_at IS NULL'
        : '';

    try {
        const [viewRows] = await runQuery(
            `
                SELECT v.*
                FROM ${COURSE_TABLE} c
                JOIN ${COURSE_VIEW} v
                ON c.${primaryKey} = v.class_id
                WHERE c.${primaryKey} = :id
                ${softDeleteCondition}
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

    const selectColumns = ['c.*'];
    const joins = [];
    if (columns.has('category_id')) {
        selectColumns.push('cat.name AS category_name');
        joins.push('LEFT JOIN categories cat ON cat.id = c.category_id');
    }
    if (columns.has('tutor_id')) {
        selectColumns.push('t.name AS tutor_name');
        joins.push('LEFT JOIN tutors t ON t.id = c.tutor_id');
    }
    const sql = `
        SELECT ${selectColumns.join(', ')}
        FROM ${COURSE_TABLE} c
        ${joins.join(' ')}
        WHERE c.${primaryKey} = :id
        ${softDeleteCondition}
        LIMIT 1
    `;
    const [rows] = await runQuery(sql, {
        id,
    });
    return rows[0] ?? null;
}

export async function findActiveCourseRowById(id) {
    const [columns, primaryKey] = await Promise.all([
        getCourseColumns(),
        getCoursePrimaryKey(),
    ]);
    const softDeleteCondition = columns.has('deleted_at')
        ? 'AND deleted_at IS NULL'
        : '';
    const sql = `
        SELECT ${primaryKey} AS id
        FROM ${COURSE_TABLE}
        WHERE ${primaryKey} = :id
        ${softDeleteCondition}
        LIMIT 1
    `;
    const [rows] = await runQuery(sql, {
        id,
    });
    return rows[0] ?? null;
}

export async function createCourse(payload) {
    const [columns, primaryKey] = await Promise.all([
        getCourseColumns(),
        getCoursePrimaryKey(),
    ]);
    const data = sanitizePayload(payload, columns, primaryKey);
    const fields = Object.keys(data);
    if (fields.length === 0) {
        const error = new Error('No valid fields provided to create course');
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
    const [result] = await runQuery(sql, data);
    return result.insertId;
}

export async function updateCourse(id, payload) {
    const [columns, primaryKey] = await Promise.all([
        getCourseColumns(),
        getCoursePrimaryKey(),
    ]);
    const data = sanitizePayload(payload, columns, primaryKey);
    const fields = Object.keys(data);
    if (fields.length === 0) {
        return false;
    }
    const setSql = fields
        .map((field) => `\`${field}\` = :${field}`)
        .join(', ');
    const softDeleteCondition = columns.has('deleted_at')
        ? 'AND deleted_at IS NULL'
        : '';
    const sql = `
        UPDATE ${COURSE_TABLE}
        SET ${setSql}
        WHERE ${primaryKey} = :id
        ${softDeleteCondition}
    `;
    const [result] = await runQuery(sql, {
        ...data,
        id,
    });
    return result.affectedRows > 0;
}

export async function softDeleteCourse(id) {
    const [columns, primaryKey] = await Promise.all([
        getCourseColumns(),
        getCoursePrimaryKey(),
    ]);
    if (!columns.has('deleted_at')) {
        const error = new Error(
            'The course table does not support soft delete operation due to missing deleted_at column'
        );
        error.statusCode = 422;
        error.status = 422;
        error.isOperational = true;
        throw error;
    }
    const sql = `
        UPDATE ${COURSE_TABLE}
        SET deleted_at = NOW()
        WHERE ${primaryKey} = :id
        AND deleted_at IS NULL
    `;
    const [result] = await runQuery(sql, {
        id,
    });
    return result.affectedRows > 0;
}

export async function hardDeleteCourse(id) {
    const primaryKey = await getCoursePrimaryKey();
    const sql = `
        DELETE FROM ${COURSE_TABLE}
        WHERE ${primaryKey} = :id
    `;
    const [result] = await runQuery(sql, {
        id,
    });
    return result.affectedRows > 0;
}