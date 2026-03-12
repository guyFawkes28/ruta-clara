import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import {authRoutes} from './src/routes/auth.routes.js'
import { maintenanceRoutes } from './src/routes/zona.routes.js'
import cookieParser from 'cookie-parser'
import { verifyToken } from './src/middlewares/auth.middleware.js'

const app = express()

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true               
}));

app.use(morgan('dev'))

app.use(express.json())

app.use(cookieParser())


app.use('/api/auth',authRoutes)
app.use('/api/maintenance',verifyToken,maintenanceRoutes)



const PORT = process.env.PORT || 4000

app.listen(PORT, ()=>{

    console.log(`servidor listo y escuchando en http://localhost:${PORT}`)
})