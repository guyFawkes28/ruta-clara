import Chat from '../models/Chat.model.js';

// Enviar un mensaje de chat
export const send_message = async (req, res) => {
  try {
    const { message, sender, senderName, senderEmail, role, recipient } = req.body;

    // Validaciones
    if (!message || !sender || !senderName || !senderEmail) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: message, sender, senderName, senderEmail',
      });
    }

    if (!['HOME', 'DASHBOARD'].includes(sender)) {
      return res.status(400).json({
        error: 'sender debe ser "HOME" o "DASHBOARD"',
      });
    }

    // Crear documento de chat
    const chatMsg = new Chat({
      sender,
      senderName,
      senderEmail,
      message: message.trim(),
      role: role || 'OPERATOR',
      recipient: recipient || (sender === 'HOME' ? 'DASHBOARD' : 'HOME'),
      isRead: false,
    });

    await chatMsg.save();

    console.log(`[CHAT] Nuevo mensaje de ${sender} a ${chatMsg.recipient}`);

    res.status(201).json({
      success: true,
      message: 'Mensaje enviado',
      data: chatMsg,
    });
  } catch (err) {
    console.error('[CHAT] Error al enviar mensaje:', err);
    res.status(500).json({
      error: 'Error al enviar el mensaje',
      details: err.message,
    });
  }
};

// Obtener todos los mensajes (para una vista específica)
export const get_messages = async (req, res) => {
  try {
    const { limit = 50, skip = 0, view } = req.query;

    // Validar view (HOME o DASHBOARD)
    if (!view || !['HOME', 'DASHBOARD'].includes(view)) {
      return res.status(400).json({
        error: 'Parámetro "view" requerido: "HOME" o "DASHBOARD"',
      });
    }

    // Obtener mensajes para esta vista (incluyendo los que se enviaron desde aquí hacia la otra)
    const messages = await Chat.find({
      $or: [
        { recipient: view },
        { sender: view },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Marcar como leídos
    await Chat.updateMany(
      { recipient: view, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      count: messages.length,
      data: messages.reverse(), // Invertir para mostrar cronológicamente
    });
  } catch (err) {
    console.error('[CHAT] Error al obtener mensajes:', err);
    res.status(500).json({
      error: 'Error al obtener los mensajes',
      details: err.message,
    });
  }
};

// Obtener mensajes no leídos para una vista
export const get_unread_count = async (req, res) => {
  try {
    const { view } = req.query;

    if (!view || !['HOME', 'DASHBOARD'].includes(view)) {
      return res.status(400).json({
        error: 'Parámetro "view" requerido',
      });
    }

    const count = await Chat.countDocuments({
      recipient: view,
      isRead: false,
    });

    res.json({
      success: true,
      unreadCount: count,
    });
  } catch (err) {
    console.error('[CHAT] Error al contar no leídos:', err);
    res.status(500).json({
      error: 'Error al contar mensajes no leídos',
      details: err.message,
    });
  }
};

// Limpiar/Borrar todos los mensajes (opcional, útil para pruebas)
export const clear_messages = async (req, res) => {
  try {
    const result = await Chat.deleteMany({});
    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: 'Todos los mensajes han sido eliminados',
    });
  } catch (err) {
    console.error('[CHAT] Error al limpiar mensajes:', err);
    res.status(500).json({
      error: 'Error al limpiar los mensajes',
      details: err.message,
    });
  }
};
