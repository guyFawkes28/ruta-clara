import urlApi from './axiosConfig.js';

const API_URL = '/chat';

const chatService = {
  /**
   * Enviar un mensaje
   * @param {Object} payload - { message, sender, senderName, senderEmail, role, recipient }
   * @returns {Promise}
   */
  sendMessage: async (payload) => {
    try {
      const response = await urlApi.post(`${API_URL}/send`, payload);
      return response.data;
    } catch (err) {
      console.error('[chatService] Error enviando mensaje:', err);
      throw err;
    }
  },

  /**
   * Obtener mensajes para una vista (HOME o DASHBOARD)
   * @param {string} view - 'HOME' o 'DASHBOARD'
   * @param {number} limit - Cantidad de mensajes (default 50)
   * @param {number} skip - Saltar N mensajes (default 0)
   * @returns {Promise}
   */
  getMessages: async (view, limit = 50, skip = 0) => {
    try {
      const response = await urlApi.get(`${API_URL}/messages`, {
        params: { view, limit, skip },
      });
      return response.data.data || [];
    } catch (err) {
      console.error('[chatService] Error obteniendo mensajes:', err);
      throw err;
    }
  },

  /**
   * Obtener cantidad de mensajes no leídos
   * @param {string} view - 'HOME' o 'DASHBOARD'
   * @returns {Promise}
   */
  getUnreadCount: async (view) => {
    try {
      const response = await urlApi.get(`${API_URL}/unread`, {
        params: { view },
      });
      return response.data.unreadCount || 0;
    } catch (err) {
      console.error('[chatService] Error obteniendo conteo no leído:', err);
      return 0;
    }
  },

  /**
   * Limpiar/Borrar todos los mensajes
   * @returns {Promise}
   */
  clearMessages: async () => {
    try {
      const response = await urlApi.delete(`${API_URL}/clear`);
      return response.data;
    } catch (err) {
      console.error('[chatService] Error limpiando mensajes:', err);
      throw err;
    }
  },

  /**
   * Escuchar mensajes en tiempo real
   * @param {Function} callback - Función a ejecutar cuando se reciba un mensaje
   */
};

export default chatService;
