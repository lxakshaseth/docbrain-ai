import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../../config/env.js';
import { AppError } from '../../core/appError.js';

if (!fs.existsSync(config.upload.uploadDir)) {
  fs.mkdirSync(config.upload.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.upload.uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

export const uploadPdf = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSizeMb * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ];
    const allowedExtensions = ['.pdf', '.docx', '.txt', '.md'];
    const hasValidExt = allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));
    if (allowedMimeTypes.includes(file.mimetype) || hasValidExt) {
      cb(null, true);
    } else {
      cb(new AppError('Only PDF, DOCX, TXT, and Markdown (.md) files are allowed', 400));
    }
  },
});
