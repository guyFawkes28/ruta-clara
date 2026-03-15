import express from 'express'
import {
  initialize_task_execution,
  register_sst,
  finish_task,
  get_task_execution,
  get_estimated_duration,
  get_performance_metrics
} from '../controllers/execution.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'

const router = express.Router()

// POST: Iniciar ejecución de tarea
router.post('/init', verifyToken, initialize_task_execution)

// POST: Registrar protocolo SST
router.post('/register-sst', verifyToken, register_sst)

// POST: Finalizar tarea (foto + descuento)
router.post('/finish', verifyToken, finish_task)

// GET: Obtener detalles de ejecución
router.get('/:tarea_id', verifyToken, get_task_execution)

// GET: Estimar duración de tarea
router.get('/estimate/duration', verifyToken, get_estimated_duration)

// GET: Métricas de desempeño (para dashboard)
router.get('/metrics/performance', verifyToken, get_performance_metrics)

export const executionRoutes = router
