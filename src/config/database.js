import mysql from 'mysql2';
import config from './env.js';

const pool = mysql.createPool({
    ...config.db,
    charset: 'utf8mb4_unicode_ci',
    namedPlaceholders: true,
});

export default pool.promise();