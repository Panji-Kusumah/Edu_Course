import 'dotenv/config';
import './config/env.js';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendSuccess } from './utils/respond.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());

const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : [];
app.use(
    cors({
        origin: corsOrigins.length > 0 ? corsOrigins : true,
    })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

if (process.env.NODE_ENV !== 'test') {
    const morganMode = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
    app.use(morgan(morganMode));
}

app.get('/', (req, res) => {
    return sendSuccess(res, {
        statusCode: 200,
        message: 'Edu Course API',
        data: {
            name: 'Edu Course API',
            docs: '/api/v1',
            health: '/api/v1/health',
        },
    });
});

app.use('/api/v1', routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;