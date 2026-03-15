import express from 'express'
import {
  initializeTaskExecution,
  registerSST,
  finishTask,
  getTaskExecution,
  getEstimatedDuration,
  getPerformanceMetrics
} from '../controllers/execution.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'

const router = express.Router()

// POST: Iniciar ejecución de tarea
router.post('/init', verifyToken, initializeTaskExecution)

// POST: Registrar protocolo SST
router.post('/register-sst', verifyToken, registerSST)

// POST: Finalizar tarea (foto + descuento)
router.post('/finish', verifyToken, finishTask)

// GET: Obtener detalles de ejecución
router.get('/:tarea_id', verifyToken, getTaskExecution)

// GET: Estimar duración de tarea
router.get('/estimate/duration', verifyToken, getEstimatedDuration)

// GET: Métricas de desempeño (para dashboard)
router.get('/metrics/performance', verifyToken, getPerformanceMetrics)

export const executionRoutes = router
