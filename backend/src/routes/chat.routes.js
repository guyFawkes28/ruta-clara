import express from 'express';
import {
  sendMessage,
  getMessages,
  getUnreadCount,
  clearMessages,
} from '../controllers/chat.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// POST /api/chat/send - Enviar un mensaje
router.post('/send', verifyToken, sendMessage);

// GET /api/chat/messages?view=HOME&limit=50&skip=0  - Obtener mensajes para una vista
router.get('/messages', verifyToken, getMessages);

// GET /api/chat/unread?view=DASHBOARD - Obtener cantidad de mensajes no leídos
router.get('/unread', verifyToken, getUnreadCount);

// DELETE /api/chat/clear - Limpiar todos los mensajes (admin only)
router.delete('/clear', verifyToken, clearMessages);

export { router as chatRoutes };
