import { io } from 'socket.io-client'
import { persistence } from '../util/persistence.js'

let socket = null
let connect_promise = null
// Internal list of message handlers to allow multiple listeners
let messageHandlers = []

export const socket_manager = {
  /**
   * Connect to WebSocket server
   * @param {string} view - 'HOME' or 'DASHBOARD'
   * @returns {Promise}
   */
  connect: async (view) => {
    return new Promise((resolve, reject) => {
      try {
        const user = persistence.getUser()
        
        // If a connection is already in progress, return that promise
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
        
        // If a connection already exists, reuse it
        if (socket?.connected) {
          console.log('[Socket] Already connected, reusing connection')
          socket.emit('join', { 
            view, 
            user_name: user?.name || 'User',
            user_email: user?.email || 'unknown@mail.com'
          })
          return resolve(socket)
        }

        // Create new connection
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

            // Forward incoming 'new-message' events to all registered handlers
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
   * Send a message
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
   * Listen to new messages
   * @param {Function} callback - Function that receives the message
   */
  on_message: (callback) => {
    // Register a message handler in the internal list.
    // Handlers will be invoked when the socket receives 'new-message'.
    if (!callback || typeof callback !== 'function') return
    messageHandlers.push(callback)
    // Return unsubscribe function
    return () => {
      messageHandlers = messageHandlers.filter(cb => cb !== callback)
    }
  },

  /**
   * Listen to send confirmation
   * @param {Function} callback
   */
  on_message_sent: (callback) => {
    if (!socket) return
    socket.off('message-sent')
    socket.on('message-sent', callback)
  },

  /**
   * Listen to message errors
   * @param {Function} callback
   */
  on_message_error: (callback) => {
    if (!socket) return
    socket.off('message-error')
    socket.on('message-error', callback)
  },

  /**
   * Listen when someone joins
   * @param {Function} callback
   */
  on_user_joined: (callback) => {
    if (!socket) return
    socket.on('user-joined', callback)
  },

  /**
   * Emit task status change
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
   * Listen to task status changes from other users
   * @param {Function} callback - Receives { task_id, tag, status, new_status }
   */
  on_task_status_change: (callback) => {
    if (!socket) return
    socket.off('task-status-changed')
    socket.on('task-status-changed', callback)
  },

  /**
   * Listen to task completed event (to reload entire map)
   * @param {Function} callback
   */
  on_task_completed: (callback) => {
    if (!socket) return
    socket.off('task-completed')
    socket.on('task-completed', callback)
  },

  /**
   * Disconnect
   */
  disconnect: () => {
    if (socket) {
      socket.disconnect()
      socket = null
      console.log('[Socket] Disconnected')
    }
  },

  /**
   * Get connection status
   */
  is_connected: () => socket?.connected || false,

  /**
   * Get the socket (if you need direct access)
   */
  get_socket: () => socket,

  /**
   * Listen to connection changes
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
