import 'dotenv/config';
import app from './src/app.js';

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(` Edu Course API Service is running`);
    console.log(` Local URL:   http://localhost:${PORT}`);
    console.log(` Health Check: http://localhost:${PORT}/api/v1/health`);
    console.log(` Courses API: http://localhost:${PORT}/api/v1/course`);
});
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
        console.log(' HTTP server closed.');
        process.exit(0);
    });
    setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));