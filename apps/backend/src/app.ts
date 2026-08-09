import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config/env.js';
import { logger } from './core/logger.js';
import { ApiResult } from './utils/apiResponse.js';
import { initRedis, checkRedisHealth, closeRedisConnections } from './redis/redisClient.js';
import { startRedisSubscriber } from './redis/redisSubscriber.js';
import { setupSwagger } from './config/swagger.js';

import authRoutes from './features/auth/auth.routes.js';
import documentRoutes from './features/documents/document.routes.js';
import chatRoutes from './features/chat/chat.routes.js';

const app: Express = express();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Swagger API Documentation UI (/api-docs)
setupSwagger(app);

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  return ApiResult.success(
    res,
    {
      status: 'online',
      timestamp: new Date().toISOString(),
      env: config.env,
    },
    'Service Health OK'
  );
});

// Redis Health Check Endpoint
app.get('/health/redis', async (_req: Request, res: Response) => {
  const redisHealth = await checkRedisHealth();
  if (redisHealth.status === 'healthy') {
    return ApiResult.success(res, redisHealth, 'Redis Health OK');
  } else {
    return ApiResult.error(res, 'Redis Health Check Failed', 503, 'REDIS_UNHEALTHY', redisHealth);
  }
});

// Disable Mongoose query buffering to prevent 10s timeout hangs when database is unreachable
mongoose.set('bufferCommands', false);

// Database Connection Check Middleware for API routes
app.use('/api/v1', async (_req: Request, res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      logger.info(`Database not connected (state: ${mongoose.connection.readyState}). Connecting to MongoDB...`);
      await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 4000 });
      next();
    } catch (err: any) {
      const errorMsg = err?.message || err?.stack || String(err);
      logger.error(`Database connection error: ${errorMsg}`);
      return ApiResult.error(
        res,
        `Database connection unavailable (${errorMsg}). Please ensure MONGODB_URI is configured and your current IP address is whitelisted in MongoDB Atlas Network Access (0.0.0.0/0).`,
        503,
        'DATABASE_DISCONNECTED'
      );
    }
  } else {
    next();
  }
});

// Feature API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/chat', chatRoutes);

// Root Endpoint
app.get(['/', '/api/v1'], (_req: Request, res: Response) => {
  return ApiResult.success(
    res,
    {
      version: '1.0.0',
      description: 'PDF Knowledge Base AI Chatbot Backend API',
      swaggerDocs: '/api-docs',
      health: '/health',
      endpoints: [
        '/api/v1/auth/login',
        '/api/v1/documents/upload',
        '/api/v1/documents',
        '/api/v1/documents/:id',
        '/api/v1/documents/:id/reprocess',
        '/api/v1/chat',
        '/api/v1/chat/history',
        '/health/redis',
      ],
    },
    'PDF Knowledge Base AI Chatbot Backend API is Live'
  );
});

// 404 Route Handler
app.use((_req: Request, res: Response) => {
  return ApiResult.error(res, 'Route not found', 404, 'NOT_FOUND');
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled Error:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return ApiResult.error(res, message, statusCode, err.code || 'INTERNAL_ERROR', err.details);
});

let server: ReturnType<typeof app.listen> | null = null;

// Server Initialization
const startServer = async () => {
  // Bind HTTP server immediately so cloud platforms (Render) detect open port instantly
  server = app.listen(config.port, () => {
    logger.info(`Node Backend running on port ${config.port} in ${config.env} mode`);
    logger.info(`Swagger API Docs available at http://localhost:${config.port}/api-docs`);
  });

  // Connect to MongoDB
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('Connected to MongoDB successfully');
  } catch (error: any) {
    const errorMsg = error?.message || error?.stack || String(error);
    logger.error(`Failed to connect to MongoDB: ${errorMsg}`);
    logger.warn('Please ensure MONGODB_URI is set correctly and 0.0.0.0/0 is allowed in MongoDB Atlas Network Access.');
  }

  // Connect to Redis Pub/Sub
  try {
    await initRedis();
    await startRedisSubscriber();
  } catch (error: any) {
    logger.warn('Redis Pub/Sub initialization notice:', error.message || error);
  }
};

// Graceful Shutdown Handlers
const handleShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await closeRedisConnections();
      await mongoose.disconnect();
      logger.info('MongoDB disconnected cleanly');
      process.exit(0);
    });
  } else {
    await closeRedisConnections();
    await mongoose.disconnect();
    process.exit(0);
  }
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

startServer();

export default app;
