import { Router } from 'express';
import { DocumentController } from './document.controller.js';
import { authenticateJwt } from '../auth/auth.middleware.js';
import { uploadPdf } from './document.middleware.js';

const router = Router();

router.use(authenticateJwt);

router.post('/upload', uploadPdf.single('file'), DocumentController.upload);
router.get('/', DocumentController.list);
router.get('/:id', DocumentController.getById);
router.delete('/:id', DocumentController.remove);
router.post('/:id/reprocess', DocumentController.reprocess);

export default router;
