import prisma from '../config/prisma.js';

export const courseRepository = {
    getAll: async (filters) => {
        // View v_course_cards sudah memfilter deleted_at IS NULL di dalamnya
        const conditions = [];
        const params = [];

        if (filters.status) {
            conditions.push('status = ?');
            params.push(filters.status);
        }
        if (filters.level) {
            conditions.push('level = ?');
            params.push(filters.level);
        }
        if (filters.category_id) {
            conditions.push('category_id = ?');
            params.push(Number(filters.category_id));
        }
        if (filters.topic) {
            conditions.push('category_name LIKE ?');
            params.push(`%${filters.topic}%`);
        }
        if (filters.search) {
            conditions.push('(title LIKE ? OR description LIKE ?)');
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        const whereClause =
            conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const allowedSorts = {
            newest: 'created_at DESC',
            oldest: 'created_at ASC',
            price_asc: 'price ASC',
            price_desc: 'price DESC',
            rating: 'avg_rating DESC',
            title_asc: 'title ASC',
        };
        const sortClause = allowedSorts[filters.sortBy] || 'created_at DESC';

        const offset = (filters.page - 1) * filters.limit;

        const query = `
            SELECT * FROM v_course_cards
            ${whereClause}
            ORDER BY ${sortClause}
            LIMIT ? OFFSET ?
        `;

        const countQuery = `SELECT COUNT(*) as total FROM v_course_cards ${whereClause}`;

        const [data, countResult] = await Promise.all([
            prisma.$queryRawUnsafe(query, ...params, filters.limit, offset),
            prisma.$queryRawUnsafe(countQuery, ...params),
        ]);

        return {
            data: data.map((row) => ({
                ...row,
                class_id: Number(row.class_id),
                category_id: Number(row.category_id),
                price: Number(row.price),
                avg_rating: Number(row.avg_rating),
                total_review: Number(row.total_review),
            })),
            total: Number(countResult[0].total),
        };
    },

    getById: async (id) => {
        return prisma.classes.findUnique({
            where: { class_id: Number(id), deleted_at: null },
            include: {
                tutors: true,
                categories: true,
                modules: {
                    orderBy: { sequence: 'asc' },
                    include: {
                        materials: { orderBy: { sequence: 'asc' } },
                    },
                },
                reviews: {
                    include: {
                        users: { select: { user_id: true, name: true, photo: true } },
                    },
                    orderBy: { created_at: 'desc' },
                },
            },
        });
    },

    create: async (data) => {
        return prisma.classes.create({ data });
    },

    update: async (id, data) => {
        return prisma.classes.update({
            where: { class_id: Number(id) },
            data,
        });
    },

    softDelete: async (id) => {
        return prisma.classes.update({
            where: { class_id: Number(id) },
            data: { deleted_at: new Date() },
        });
    },

    hardDelete: async (id) => {
        return prisma.classes.delete({
            where: { class_id: Number(id) },
        });
    },
};