import { Router } from 'express';
import { ChatController } from './chat.controller.js';
import { authenticateJwt } from '../auth/auth.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import { ChatQuerySchema, ChatHistoryQuerySchema } from '../../dtos/chat.dto.js';

const router = Router();

router.use(authenticateJwt);

router.post('/', validateRequest(ChatQuerySchema), ChatController.processChat);
router.get('/history', validateRequest(ChatHistoryQuerySchema), ChatController.getHistory);
router.post('/conversations', ChatController.createConversation);
router.get('/conversations', ChatController.listConversations);
router.get('/conversations/:conversationId/messages', ChatController.getMessagesForConversation);
router.delete('/conversations/:conversationId', ChatController.deleteConversation);

export default router;
