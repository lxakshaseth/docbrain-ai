import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try loading .env from current directory or apps/backend directory
const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'apps', 'backend', '.env'),
  path.resolve(__dirname, '..', '..', '.env'),
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const defaultMongoUri = 'mongodb://localhost:27017/pdf_chatbot';
const defaultJwtSecret = 'your_jwt_secret_change_in_production';

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || defaultMongoUri,
  redis: {
    url: process.env.REDIS_URL || undefined,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    optional: process.env.REDIS_OPTIONAL?.trim() === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET || defaultJwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  upload: {
    maxSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001',
};

