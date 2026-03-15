import express from 'express'
import {
  improveReport,
  getOptimizedTaskOrder,
  suggestPurchases,
  improveDescription
} from '../controllers/ai.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'

const router = express.Router()

// POST: Mejorar clasificación de un reporte
router.post('/improve-report', verifyToken, improveReport)

// POST: Mejorar descripción de un reporte (corregir ortografía y hacerlo más detallado)
router.post('/improve-description', verifyToken, improveDescription)

// GET: Obtener orden optimizado de tareas
router.get('/optimize-tasks', verifyToken, getOptimizedTaskOrder)

// GET: Sugerir órdenes de compra
router.get('/suggest-purchases', verifyToken, suggestPurchases)

export const aiRoutes = router
