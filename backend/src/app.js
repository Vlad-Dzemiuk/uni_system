import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from "cookie-parser";

import { env } from './config/env.js';
import { httpLogger } from './logger/http.js';
import { router } from './routes/index.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

export function createApp() {
    const app = express();

    app.set('trust proxy', true);
    app.use(cookieParser())
    app.use(httpLogger);
    app.use(helmet());
    app.use(cors({ origin: env.CORS_ORIGINS.length ? env.CORS_ORIGINS : true, credentials: true }));
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: false })); 
    app.use((req, res, next) => {
    if (req.url.startsWith("/api/auth")) {
        console.log(">>>", req.method, req.url);
        console.log("CT:", req.headers["content-type"]);
        console.log("BODY:", req.body);
    }
    next();
    });

    app.get('/health', (req, res) => {
        res.json({ ok: true, ts: new Date().toISOString() });
    });

    app.use('/api', router);

    app.use(notFound);
    app.use(errorHandler);

    return app;
}
