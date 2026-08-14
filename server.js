import 'dotenv/config';
import app from './src/app.js';
import * as databaseModule from './src/config/database.js';

const PORT = Number(process.env.PORT || 3000);
const pool =
    databaseModule.default ||
    databaseModule.pool ||
    databaseModule.db ||
    databaseModule.connection;

let server;
async function closeDatabase() {
    try {
        if (pool && typeof pool.end === 'function') {
            await pool.end();
            console.log('Database connection pool closed successfully.');
        }
    } catch (error) {
        console.error('Failed to close database pool:', error);
    }
}

function shutdown(signal) {
    console.log(`\n${signal} received. Initiating graceful shutdown...`);
    if (!server) {
        process.exit(0);
    }
    server.close(async () => {
        await closeDatabase();
        console.log('Server shut down gracefully.');
        process.exit(0);
    });
    setTimeout(() => {
        console.error('Forced shutdown: Server did not respond within 10s timeout.');
        process.exit(1);
    }, 10000).unref();
}

async function startServer() {
    try {
        if (pool && typeof pool.getConnection === 'function') {
            const connection = await pool.getConnection();
            console.log(' Database connection established successfully.');
            connection.release();
        } else {
            console.warn(' Database connection pool not found. Proceeding without active DB connection.');
        }
        server = app.listen(PORT, () => {
            //biar kren aja 
            console.log('\x1b[32m%s\x1b[0m','---------------------------------------------------');
            console.log('\x1b[32m%s\x1b[0m',' Edu Course API Service is running');
            console.log(` Local URL:   http://localhost:${PORT}`);
            console.log(` Health Check: http://localhost:${PORT}/api/v1/health`);
            console.log(` Courses API: http://localhost:${PORT}/api/v1/course`);
            console.log('\x1b[32m%s\x1b[0m','----------------------------------------------------');
        });
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    } catch (error) {
        console.error('Fatal Error: Failed to start server:', error);
        process.exit(1);
    }
}
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

startServer();