import { io } from 'socket.io-client'
import { persistence } from '../util/persistence.js'

let socket = null
let connectPromise = null

export const socketManager = {
  /**
   * Conectar al servidor de WebSocket
   * @param {string} view - 'HOME' o 'DASHBOARD'
   * @returns {Promise}
   */
  connect: async (view) => {
    return new Promise((resolve, reject) => {
      try {
        const user = persistence.getUser()
        
        // Si ya hay una conexión en proceso, devolver esa promise
        if (connectPromise) {
          console.log('[Socket] Conexión en progreso, reutilizando...')
          connectPromise.then(() => {
            if (socket?.connected) {
              socket.emit('join', { 
                view, 
                userName: user?.name || 'Usuario',
                userEmail: user?.email || 'unknown@mail.com'
              })
              resolve(socket)
            }
          }).catch(reject)
          return
        }
        
        // Si ya existe conexión establecida, reutilizarla
        if (socket?.connected) {
          console.log('[Socket] Ya conectado, reutilizando conexión')
          socket.emit('join', { 
            view, 
            userName: user?.name || 'Usuario',
            userEmail: user?.email || 'unknown@mail.com'
          })
          return resolve(socket)
        }

        // Crear nueva conexión
        connectPromise = new Promise((resolveConnect, rejectConnect) => {
          socket = io('http://localhost:4000', {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
          })

          socket.on('connect', () => {
            console.log(`[Socket] Conectado: ${socket.id}`)
            socket.emit('join', {
              view,
              userName: user?.name || 'Usuario',
              userEmail: user?.email || 'unknown@mail.com'
            })
            connectPromise = null
            resolveConnect(socket)
            resolve(socket)
          })

          socket.on('connect_error', (err) => {
            console.error('[Socket] Error de conexión:', err)
            connectPromise = null
            rejectConnect(err)
            reject(err)
          })
        })
      } catch (err) {
        console.error('[Socket] Error conectando:', err)
        connectPromise = null
        reject(err)
      }
    })
  },

  /**
   * Enviar un mensaje
   * @param {Object} msg - { message, sender, senderName, senderEmail, role, recipient }
   */
  sendMessage: (msg) => {
    if (!socket?.connected) {
      console.error('[Socket] No conectado. Intenta reconectar.')
      return false
    }
    socket.emit('send-message', msg)
    return true
  },

  /**
   * Escuchar nuevos mensajes
   * @param {Function} callback - Función que recibe el mensaje
   */
  onMessage: (callback) => {
    if (!socket) return
    // Remover listeners antiguos para evitar duplicados
    socket.off('new-message')
    socket.on('new-message', callback)
  },

  /**
   * Escuchar confirmación de envío
   * @param {Function} callback
   */
  onMessageSent: (callback) => {
    if (!socket) return
    socket.off('message-sent')
    socket.on('message-sent', callback)
  },

  /**
   * Escuchar errores de mensaje
   * @param {Function} callback
   */
  onMessageError: (callback) => {
    if (!socket) return
    socket.off('message-error')
    socket.on('message-error', callback)
  },

  /**
   * Escuchar cuando alguien se une
   * @param {Function} callback
   */
  onUserJoined: (callback) => {
    if (!socket) return
    socket.on('user-joined', callback)
  },

  /**
   * Desconectar
   */
  disconnect: () => {
    if (socket) {
      socket.disconnect()
      socket = null
      console.log('[Socket] Desconectado')
    }
  },

  /**
   * Obtener estado de conexión
   */
  isConnected: () => socket?.connected || false,

  /**
   * Obtener el socket (si necesitas acceso directo)
   */
  getSocket: () => socket,

  /**
   * Escuchar cambios de conexión
   * @param {Function} callback
   */
  onConnectionChange: (callback) => {
    if (!socket) return
    socket.on('connect', () => callback(true))
    socket.on('disconnect', () => callback(false))
    socket.on('connect_error', () => callback(false))
  }
}

export default socketManager
