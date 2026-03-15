import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { createServer } from 'http'
import { Server } from 'socket.io'
import {authRoutes} from './src/routes/auth.routes.js'
import { maintenanceRoutes } from './src/routes/maintenance.routes.js'
import { chatRoutes } from './src/routes/chat.routes.js'
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

    // Usuario desconecta
    socket.on('disconnect', () => {
        console.log(`[SOCKET] Usuario desconectado: ${socket.id}`)
    })
})

const PORT = process.env.PORT || 4000

// Conectar a MongoDB al iniciar
connectMongo().then(() => {
    httpServer.listen(PORT, ()=>{
        console.log(`✓ Servidor listo en http://localhost:${PORT}`)
        console.log(`✓ WebSocket disponible`)
    })
}).catch(err => {
    console.error('✗ No se pudo iniciar el servidor:', err)
    process.exit(1)
})