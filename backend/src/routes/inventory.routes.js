import express from 'express'
import { 
  getAllRepuestos,
  getRepuesto,
  checkAvailability,
  validateTaskStart,
  descontarRepuestos,
  getLowStockAlerts,
  agregarStock,
  getMovementHistory,
  getRepuestoTypes,
  getRepuestosGroupedByType
} from '../controllers/inventory.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'

const router = express.Router()

// ─── STATIC ROUTES FIRST (before dynamic :id) ───
// GET: Obtener tipos de repuestos
router.get('/tipos-repuestos', verifyToken, getRepuestoTypes)

// GET: Obtener repuestos agrupados por tipo
router.get('/repuestos/agrupados', verifyToken, getRepuestosGroupedByType)

// GET: Alertas de stock bajo
router.get('/alerts/low-stock', verifyToken, getLowStockAlerts)

// ─── DYNAMIC ROUTES (after static) ───
// POST: Verificar disponibilidad de un repuesto
router.post('/check-availability', verifyToken, checkAvailability)

// POST: Validar si una tarea puede iniciarse (Hard-Lock)
router.post('/validate-task-start', verifyToken, validateTaskStart)

// POST: Descontar repuestos al completar tarea
router.post('/descontar', verifyToken, descontarRepuestos)

// POST: Agregar stock (compra)
router.post('/add-stock', verifyToken, agregarStock)

// GET: Historial de movimientos de un repuesto
router.get('/movements/:repuesto_id', verifyToken, getMovementHistory)

// GET: Listar repuestos
router.get('/repuestos', verifyToken, getAllRepuestos)

// GET: Obtener repuesto por ID (MUST BE LAST - dynamic :id)
router.get('/repuestos/:id', verifyToken, getRepuesto)

export const inventoryRoutes = router
