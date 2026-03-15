import express from 'express';
import {
  send_message,
  get_messages,
  get_unread_count,
  clear_messages,
} from '../controllers/chat.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// POST /api/chat/send - Enviar un mensaje
router.post('/send', verifyToken, send_message);

// GET /api/chat/messages?view=HOME&limit=50&skip=0  - Obtener mensajes para una vista
router.get('/messages', verifyToken, get_messages);

// GET /api/chat/unread?view=DASHBOARD - Obtener cantidad de mensajes no leídos
router.get('/unread', verifyToken, get_unread_count);

// DELETE /api/chat/clear - Limpiar todos los mensajes (admin only)
router.delete('/clear', verifyToken, clear_messages);

export { router as chatRoutes };
