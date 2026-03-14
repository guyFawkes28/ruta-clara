import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
      enum: ['HOME', 'DASHBOARD'], // Origen del mensaje
    },
    senderName: {
      type: String,
      required: true, // Nombre del usuario que envía
    },
    senderEmail: {
      type: String,
      required: true, // Email del usuario
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'OPERATOR', 'ASEO'],
      default: 'OPERATOR',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    recipient: {
      type: String,
      enum: ['HOME', 'DASHBOARD'],
      default: 'DASHBOARD', // Por defecto los mensajes de HOME van a DASHBOARD y viceversa
    },
  },
  {
    timestamps: true,
  }
);

// Índices para optimizar queries
chatSchema.index({ sender: 1, createdAt: -1 });
chatSchema.index({ recipient: 1, isRead: 1 });
chatSchema.index({ createdAt: -1 });

export default mongoose.model('Chat', chatSchema);
