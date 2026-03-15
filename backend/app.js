import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { createServer } from 'http'
import { Server } from 'socket.io'
import {authRoutes} from './src/routes/auth.routes.js'
import { maintenanceRoutes } from './src/routes/maintenance.routes.js'
import { chatRoutes } from './src/routes/chat.routes.js'
import { inventoryRoutes } from './src/routes/inventory.routes.js'
import { executionRoutes } from './src/routes/execution.routes.js'
import { aiRoutes } from './src/routes/ai.routes.js'
import { transferRoutes } from './src/routes/transfer.routes.js'
import cookieParser from 'cookie-parser'
import { verifyToken } from './src/middlewares/auth.middleware.js'
import { connectMongo } from './src/config/db.js'
import Chat from './src/models/Chat.model.js'
import cleaningRoutes from "./src/routes/cleaning.routes.js";

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
        credentials: true
    }
})

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true               
}));

app.use(morgan('dev'))

app.use(express.json())

app.use(cookieParser())


app.use('/api/auth',authRoutes)
app.use('/api/maintenance',verifyToken,maintenanceRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/execution', executionRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/transfer', transferRoutes)

app.use("/api", cleaningRoutes);
app.use('/api/chat', chatRoutes)

// ─── Socket.io Events ───────────────────────────────────────
io.on('connection', (socket) => {
    console.log(`[SOCKET] Usuario conectado: ${socket.id}`)

    // Usuario se une a su sala (HOME o DASHBOARD)
    socket.on('join', ({ view, userName, userEmail }) => {
        socket.join(view)
        console.log(`[SOCKET] ${userName} (${userEmail}) unido a ${view}`)
        io.to(view).emit('user-joined', { userName, view })
    })

    // Recibir mensaje de chat
    socket.on('send-message', async ({ message, sender, senderName, senderEmail, role, recipient }) => {
        console.log(`[SOCKET] Mensaje de ${sender} a ${recipient}: ${message}`)
        
        try {
            // Guardar en MongoDB
            const chatMsg = new Chat({
                sender,
                senderName,
                senderEmail,
                message: message.trim(),
                role,
                recipient,
                isRead: false
            })
            await chatMsg.save()
            
            // Construir objeto del mensaje confirmado
            const confirmedMessage = {
                _id: chatMsg._id,
                sender,
                senderName,
                senderEmail,
                message,
                role,
                recipient,
                isRead: false,
                createdAt: chatMsg.createdAt
            }
            
            // Emitir a la sala destino en tiempo real
            io.to(recipient).emit('new-message', confirmedMessage)
            
            // Emitir confirmación al remitente (PARA QUE VEA SU PROPIO MENSAJE)
            socket.emit('new-message', confirmedMessage)
            socket.emit('message-sent', { success: true, messageId: chatMsg._id })
        } catch (err) {
            console.error('[SOCKET] Error guardando mensaje:', err)
            socket.emit('message-error', { error: err.message })
        }
    })

    // Escuchar cambios de estado de tareas y re-emitir a todos
    socket.on('task-status-changed', (data) => {
        console.log(`[SOCKET] Cambio de estado de tarea recibido:`, data)
        // Re-emitir a todos los conectados (especialmente DASHBOARD)
        io.emit('task-status-changed', data)
        console.log(`[SOCKET]  Evento re-emitido a todos`)
    })

    // Escuchar evento de tarea completada y re-emitir a todos
    socket.on('task-completed', (data) => {
        console.log(`[SOCKET] Tarea completada recibida:`, data)
        // Re-emitir a todos los conectados con indicación de recargar mapa
        io.emit('task-completed', data)
        console.log(`[SOCKET]  Evento 'task-completed' re-emitido a todos`)
    })

    // Escuchar evento de novedad reportada y re-emitir a todos
    socket.on('report-created', (data) => {
        console.log(`[SOCKET] Novedad reportada recibida:`, data)
        // Re-emitir a todos los conectados (especialmente DASHBOARD)
        io.emit('report-created', data)
        console.log(`[SOCKET]  Evento 'report-created' re-emitido a todos para actualizar mapa`)
    })

    // Usuario desconecta
    socket.on('disconnect', () => {
        console.log(`[SOCKET] Usuario desconectado: ${socket.id}`)
    })
})

const PORT = process.env.PORT || 4000

// Conectar a MongoDB al iniciar
connectMongo().then(() => {
    httpServer.listen(PORT, ()=>{
        console.log(` Servidor listo en http://localhost:${PORT}`)
        console.log(` WebSocket disponible`)
    })
}).catch(err => {
    console.error(' No se pudo iniciar el servidor:', err)
    process.exit(1)
})

// Exportar io para que otros módulos puedan usarlo
export { io }