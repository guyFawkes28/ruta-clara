import express from 'express'
import { 
  get_all_spare_parts,
  get_spare_part,
  check_availability,
  validate_task_start,
  deduct_spare_parts,
  get_low_stock_alerts,
  add_stock,
  get_movement_history,
  get_spare_part_types,
  get_spare_parts_grouped_by_type
} from '../controllers/inventory.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'

const router = express.Router()

// Rutas fijas primero (antes de :id)
// GET tipos de repuesto
router.get('/types', verifyToken, get_spare_part_types)

router.get('/spare-parts/grouped', verifyToken, get_spare_parts_grouped_by_type)

// GET alertas de stock bajo
router.get('/alerts/low-stock', verifyToken, get_low_stock_alerts)

// POST validar disponibilidad
router.post('/check-availability', verifyToken, check_availability)

// POST validar si una tarea puede iniciar
router.post('/validate-task-start', verifyToken, validate_task_start)

// POST descontar repuestos al terminar
router.post('/deduct', verifyToken, deduct_spare_parts)

// POST agregar stock
router.post('/add-stock', verifyToken, add_stock)

// GET historial de movimientos
router.get('/movements/:repuesto_id', verifyToken, get_movement_history)

// GET listar todos los repuestos
router.get('/spare-parts', verifyToken, get_all_spare_parts)

// GET repuesto por ID (debe quedar al final)
router.get('/spare-parts/:id', verifyToken, get_spare_part)

export const inventoryRoutes = router
