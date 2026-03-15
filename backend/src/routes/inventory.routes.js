import express from 'express'
import { 
  getAllRepuestos,
  getRepuesto,
  checkAvailability,
  validateTaskStart,
  descontarRepuestos,
  getLowStockAlerts,
  agregarStock,
  getMovementHistory
} from '../controllers/inventory.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'

const router = express.Router()

// GET: Listar repuestos
router.get('/repuestos', verifyToken, getAllRepuestos)

// GET: Obtener repuesto por ID
router.get('/repuestos/:id', verifyToken, getRepuesto)

// POST: Verificar disponibilidad de un repuesto
router.post('/check-availability', verifyToken, checkAvailability)

// POST: Validar si una tarea puede iniciarse (Hard-Lock)
router.post('/validate-task-start', verifyToken, validateTaskStart)

// POST: Descontar repuestos al completar tarea
router.post('/descontar', verifyToken, descontarRepuestos)

// GET: Alertas de stock bajo
router.get('/alerts/low-stock', verifyToken, getLowStockAlerts)

// POST: Agregar stock (compra)
router.post('/add-stock', verifyToken, agregarStock)

// GET: Historial de movimientos de un repuesto
router.get('/movements/:repuesto_id', verifyToken, getMovementHistory)

export const inventoryRoutes = router
