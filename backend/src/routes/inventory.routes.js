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

// ─── STATIC ROUTES FIRST (before dynamic :id) ───
// GET: Get spare part types
router.get('/types', verifyToken, get_spare_part_types)

// GET: Get spare parts grouped by type
router.get('/spare-parts/grouped', verifyToken, get_spare_parts_grouped_by_type)

// GET: Low stock alerts
router.get('/alerts/low-stock', verifyToken, get_low_stock_alerts)

// ─── DYNAMIC ROUTES (after static) ───
// POST: Check spare part availability
router.post('/check-availability', verifyToken, check_availability)

// POST: Validate if a task can start (Hard-Lock)
router.post('/validate-task-start', verifyToken, validate_task_start)

// POST: Deduct spare parts when completing task
router.post('/deduct', verifyToken, deduct_spare_parts)

// POST: Add stock (purchase)
router.post('/add-stock', verifyToken, add_stock)

// GET: Movement history of a spare part
router.get('/movements/:repuesto_id', verifyToken, get_movement_history)

// GET: List all spare parts
router.get('/spare-parts', verifyToken, get_all_spare_parts)

// GET: Get spare part by ID (MUST BE LAST - dynamic :id)
router.get('/spare-parts/:id', verifyToken, get_spare_part)

export const inventoryRoutes = router
