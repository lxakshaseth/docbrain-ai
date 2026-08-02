import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const defaultMongoUri = 'mongodb://localhost:27017/pdf_chatbot';
const defaultJwtSecret = 'your_jwt_secret_change_in_production';

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI || defaultMongoUri,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    secret: process.env.JWT_SECRET || defaultJwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  upload: {
    maxSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },
};
