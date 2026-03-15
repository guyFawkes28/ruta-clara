import { io } from 'socket.io-client'
import { persistence } from '../util/persistence.js'

let socket = null
let connect_promise = null
// Lista interna de handlers de mensajes
let messageHandlers = []

export const socket_manager = {
  /**
  * Conectar al servidor WebSocket
   * @param {string} view - 'HOME' o 'DASHBOARD'
   * @returns {Promise}
   */
  connect: async (view) => {
    return new Promise((resolve, reject) => {
      try {
        const user = persistence.getUser()
        
        // Si ya hay conexión en proceso, reutilizar promesa
        if (connect_promise) {
          console.log('[Socket] Connection in progress, reusing...')
          connect_promise.then(() => {
            if (socket?.connected) {
              socket.emit('join', { 
                view, 
                user_name: user?.name || 'User',
                user_email: user?.email || 'unknown@mail.com'
              })
              resolve(socket)
            }
          }).catch(reject)
          return
        }
        
        // Si ya hay conexión activa, reutilizarla
        if (socket?.connected) {
          console.log('[Socket] Already connected, reusing connection')
          socket.emit('join', { 
            view, 
            user_name: user?.name || 'User',
            user_email: user?.email || 'unknown@mail.com'
          })
          return resolve(socket)
        }

        // Crear nueva conexión
        connect_promise = new Promise((resolve_connect, reject_connect) => {
          socket = io('http://localhost:4000', {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
          })

          socket.on('connect', () => {
            console.log(`[Socket] Connected: ${socket.id}`)
            socket.emit('join', {
              view,
              user_name: user?.name || 'User',
              user_email: user?.email || 'unknown@mail.com'
            })

            // Reenviar 'new-message' a todos los handlers
            socket.on('new-message', (msg) => {
              try {
                messageHandlers.forEach(cb => {
                  try { cb(msg) } catch (err) { console.error('[Socket] message handler error:', err) }
                })
              } catch (err) {
                console.error('[Socket] Error distributing new-message:', err)
              }
            })

            connect_promise = null
            resolve_connect(socket)
            resolve(socket)
          })

          socket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err)
            connect_promise = null
            reject_connect(err)
            reject(err)
          })
        })
      } catch (err) {
        console.error('[Socket] Error connecting:', err)
        connect_promise = null
        reject(err)
      }
    })
  },

  /**
    * Enviar un mensaje
   * @param {Object} msg - { message, sender, senderName, senderEmail, role, recipient }
   */
  send_message: (msg) => {
    if (!socket?.connected) {
      console.error('[Socket] Not connected. Try reconnecting.')
      return false
    }
    socket.emit('send-message', msg)
    return true
  },

  /**
   * Escuchar nuevos mensajes
   * @param {Function} callback - Función que recibe el mensaje completo como objeto { _id, sender, senderName, senderEmail, message, role, recipient, isRead, createdAt }
   */
  on_message: (callback) => {
    // Registrar handler de mensajes
    if (!callback || typeof callback !== 'function') return
    messageHandlers.push(callback)
    // Devolver función para desuscribirse
    return () => {
      messageHandlers = messageHandlers.filter(cb => cb !== callback)
    }
  },

  /**
   * Escuchar confirmación de envío
   * @param {Function} callback
   */
  on_message_sent: (callback) => {
    if (!socket) return
    socket.off('message-sent')
    socket.on('message-sent', callback)
  },

  /**
   * Escuchar errores de envío
   * @param {Function} callback
   */
  on_message_error: (callback) => {
    if (!socket) return
    socket.off('message-error')
    socket.on('message-error', callback)
  },

  /**
   * Escuchar cuando alguien se une
   * @param {Function} callback
   */
  on_user_joined: (callback) => {
    if (!socket) return
    socket.on('user-joined', callback)
  },

  /**
   * Emitir cambio de estado de tarea
   * @param {Object} data - { task_id, tag, status, new_status }
   */
  emit_task_status_change: (data) => {
    if (!socket?.connected) {
      console.error('[Socket] Not connected. Status change will not be sent.')
      return false
    }
    socket.emit('task-status-changed', data)
    console.log('[Socket] Status change emitted:', data)
    return true
  },

  /**
   * Escuchar cambios de estado de tarea de otros usuarios
   * @param {Function} callback - Recibe { task_id, tag, status, new_status }
   */
  on_task_status_change: (callback) => {
    if (!socket) return
    socket.off('task-status-changed')
    socket.on('task-status-changed', callback)
  },

  /**
   * Escuchar evento de tarea completada (para recargar el mapa completo)
   * @param {Function} callback
   */
  on_task_completed: (callback) => {
    if (!socket) return
    socket.off('task-completed')
    socket.on('task-completed', callback)
  },

  /**
   *  Desconectar del servidor WebSocket
   */
  disconnect: () => {
    if (socket) {
      socket.disconnect()
      socket = null
      console.log('[Socket] Disconnected')
    }
  },

  /**
    * Obtener estado de conexión
   */
  is_connected: () => socket?.connected || false,

  /**
    * Obtener el socket (si necesitas acceso directo)
   */
  get_socket: () => socket,

  /**
    * Escuchar cambios de conexión
   * @param {Function} callback
   */
  on_connection_change: (callback) => {
    if (!socket) return
    socket.on('connect', () => callback(true))
    socket.on('disconnect', () => callback(false))
    socket.on('connect_error', () => callback(false))
  }
}

export default socket_manager
