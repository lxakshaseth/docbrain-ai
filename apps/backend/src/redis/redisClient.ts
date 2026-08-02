import Redis, { RedisOptions } from 'ioredis';
import { config } from '../config/env.js';
import { logger } from '../core/logger.js';

const MAX_RECONNECT_ATTEMPTS = 10;
let isPublisherConnected = false;
let isSubscriberConnected = false;
let lastPublisherErrorLogged = 0;
let lastSubscriberErrorLogged = 0;
let isInitializing = false;

const createRedisOptions = (): RedisOptions => {
  const options: RedisOptions = {
    lazyConnect: true,
    // Setting maxRetriesPerRequest to null per ioredis and BullMQ best practices
    // to prevent MaxRetriesPerRequestError when offline or during reconnects.
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
    connectTimeout: 5000,
    retryStrategy(times: number) {
      if (times > MAX_RECONNECT_ATTEMPTS) {
        logger.error(
          `Redis max reconnect attempts reached (${MAX_RECONNECT_ATTEMPTS}). Halting reconnect loop.`
        );
        return null; // Stops ioredis from retrying endlessly
      }
      const delay = Math.min(times * 200, 3000);
      if (!isInitializing && (times === 1 || times % 5 === 0)) {
        logger.warn(`Redis connection dropped. Attempting reconnect #${times} in ${delay}ms...`);
      }
      return delay;
    },
    reconnectOnError(err) {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true; // Force reconnect on READONLY error
      }
      return false;
    },
  };

  if (config.redis.url) {
    // If URL is provided, host and port are parsed from URL automatically by ioredis
  } else {
    options.host = config.redis.host;
    options.port = config.redis.port;
    if (config.redis.password) {
      options.password = config.redis.password;
    }
  }

  return options;
};

const options = createRedisOptions();

export const redisPublisher: Redis = config.redis.url
  ? new Redis(config.redis.url, options)
  : new Redis(options);

export const redisSubscriber: Redis = config.redis.url
  ? new Redis(config.redis.url, options)
  : new Redis(options);

// Event Listeners with Throttled Logging to Prevent Error Spam
redisPublisher.on('connect', () => {
  isPublisherConnected = true;
  logger.info('Redis Publisher client connected');
});

redisPublisher.on('ready', () => {
  isPublisherConnected = true;
});

redisPublisher.on('close', () => {
  isPublisherConnected = false;
});

redisPublisher.on('error', (err) => {
  isPublisherConnected = false;
  if (isInitializing) return; // Suppress redundant error noise during initial connect attempt
  const now = Date.now();
  // Throttle error logs to at most once every 5 seconds
  if (now - lastPublisherErrorLogged > 5000) {
    lastPublisherErrorLogged = now;
    logger.error('Redis Publisher Connection Error:', err.message || err);
  }
});

redisSubscriber.on('connect', () => {
  isSubscriberConnected = true;
  logger.info('Redis Subscriber client connected');
});

redisSubscriber.on('ready', () => {
  isSubscriberConnected = true;
});

redisSubscriber.on('close', () => {
  isSubscriberConnected = false;
});

redisSubscriber.on('error', (err) => {
  isSubscriberConnected = false;
  if (isInitializing) return; // Suppress redundant error noise during initial connect attempt
  const now = Date.now();
  // Throttle error logs to at most once every 5 seconds
  if (now - lastSubscriberErrorLogged > 5000) {
    lastSubscriberErrorLogged = now;
    logger.error('Redis Subscriber Connection Error:', err.message || err);
  }
});

/**
 * Utility to check if Redis connection is active and ready for commands.
 */
export const isRedisConnected = (): boolean => {
  return isPublisherConnected && redisPublisher.status === 'ready';
};

/**
 * Initializes Redis connection for Publisher and Subscriber.
 * If Redis is required (config.redis.optional === false) and connection fails,
 * this function throws an error to fail fast at startup.
 */
export const initRedis = async (): Promise<void> => {
  const targetHost = config.redis.url || `${config.redis.host}:${config.redis.port}`;
  isInitializing = true;
  try {
    logger.info(`Connecting to Redis Pub/Sub at ${targetHost}...`);
    await Promise.all([redisPublisher.connect(), redisSubscriber.connect()]);
    isPublisherConnected = true;
    isSubscriberConnected = true;
    logger.info(`Connected to Redis Pub/Sub successfully at ${targetHost}`);
  } catch (error: any) {
    // Gracefully disconnect clients to halt background reconnect socket loops
    try {
      redisPublisher.disconnect();
      redisSubscriber.disconnect();
    } catch (_) {}

    const errMessage = error?.message || 'Connection failed';

    if (config.redis.optional) {
      logger.warn(
        `WARNING: Could not connect to Redis at ${targetHost}. Operating in OPTIONAL mode without Pub/Sub features. Error: ${errMessage}`
      );
      return;
    }

    logger.error(
      `CRITICAL: Failed to connect to Redis at ${targetHost}. Redis is required for microservice operation. Error: ${errMessage}`
    );
    throw new Error(
      `Redis Connection Failed (${targetHost}): ${errMessage}. Ensure Redis server is running or set REDIS_OPTIONAL=true.`
    );
  } finally {
    isInitializing = false;
  }
};

/**
 * Health check utility for Redis.
 */
export const checkRedisHealth = async (): Promise<{ status: string; ping: string }> => {
  if (redisPublisher.status !== 'ready') {
    return {
      status: 'unhealthy',
      ping: `Redis status is '${redisPublisher.status}'`,
    };
  }

  try {
    const pingResult = await redisPublisher.ping();
    return { status: 'healthy', ping: pingResult };
  } catch (error: any) {
    logger.error('Redis health check failed:', error);
    return { status: 'unhealthy', ping: error.message || String(error) };
  }
};

/**
 * Gracefully disconnect Redis clients on shutdown.
 */
export const closeRedisConnections = async (): Promise<void> => {
  logger.info('Closing Redis connections...');
  try {
    if (redisPublisher.status !== 'end') {
      await redisPublisher.quit().catch(() => redisPublisher.disconnect());
    }
    if (redisSubscriber.status !== 'end') {
      await redisSubscriber.quit().catch(() => redisSubscriber.disconnect());
    }
    logger.info('Redis connections closed cleanly');
  } catch (err) {
    logger.error('Error closing Redis connections:', err);
  }
};
