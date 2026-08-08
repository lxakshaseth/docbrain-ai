import { Router } from 'express';
import { DocumentController } from './document.controller.js';
import { authenticateJwt } from '../auth/auth.middleware.js';
import { uploadPdf } from './document.middleware.js';

const router = Router();

// Unauthenticated Public Share Routes
router.get('/public/:shareToken', DocumentController.getPublicDocument);
router.get('/public/:shareToken/file', DocumentController.getPublicFile);
router.get('/public/:shareToken/summary', DocumentController.getPublicSummary);
router.post('/public/:shareToken/chat', DocumentController.publicChat);

// Authenticated Routes
router.use(authenticateJwt);

router.post('/upload', uploadPdf.single('file'), DocumentController.upload);
router.get('/', DocumentController.list);
router.post('/compare', DocumentController.compare);
router.get('/:id', DocumentController.getById);
router.get('/:id/file', DocumentController.downloadFile);
router.get('/:id/summary', DocumentController.getSummary);
router.get('/:id/study-set', DocumentController.getStudySet);
router.post('/:id/audio-overview', DocumentController.generateAudio);
router.get('/:id/audio-file', DocumentController.getAudioFile);
router.post('/:id/share', DocumentController.toggleShare);
router.delete('/:id', DocumentController.remove);
router.post('/:id/reprocess', DocumentController.reprocess);

export default router;
