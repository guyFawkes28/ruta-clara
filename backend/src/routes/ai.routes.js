import express from 'express'
import {
  improve_report,
  get_optimized_task_order,
  suggest_purchases,
  improve_description
} from '../controllers/ai.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'

const router = express.Router()

// POST: Mejorar clasificación de un reporte
router.post('/improve-report', verifyToken, improve_report)

// POST: Mejorar descripción de un reporte (corregir ortografía y hacerlo más detallado)
router.post('/improve-description', verifyToken, improve_description)

// GET: Obtener orden optimizado de tareas
router.get('/optimize-tasks', verifyToken, get_optimized_task_order)

// GET: Sugerir órdenes de compra
router.get('/suggest-purchases', verifyToken, suggest_purchases)

export const aiRoutes = router
