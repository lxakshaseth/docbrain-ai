import Redis, { RedisOptions } from 'ioredis';
import { config } from '../config/env.js';
import { logger } from '../core/logger.js';

const redisOptions: RedisOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  // Exponential backoff reconnect strategy
  retryStrategy(times: number) {
    const delay = Math.min(times * 100, 3000);
    logger.warn(`Redis connection dropped. Attempting reconnect #${times} in ${delay}ms...`);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true; // Force reconnect
    }
    return false;
  },
};

export const redisPublisher = new Redis(redisOptions);
export const redisSubscriber = new Redis(redisOptions);

redisPublisher.on('error', (err) => {
  logger.error('Redis Publisher Connection Error:', err.message);
});

redisSubscriber.on('error', (err) => {
  logger.error('Redis Subscriber Connection Error:', err.message);
});

export const initRedis = async (): Promise<void> => {
  try {
    await redisPublisher.connect();
    await redisSubscriber.connect();
    logger.info('Connected to Redis Pub/Sub successfully with retry strategy & backoff');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
  }
};

export const checkRedisHealth = async (): Promise<{ status: string; ping: string }> => {
  try {
    const pingResult = await redisPublisher.ping();
    return { status: 'healthy', ping: pingResult };
  } catch (error: any) {
    logger.error('Redis health check failed:', error);
    return { status: 'unhealthy', ping: error.message };
  }
};
