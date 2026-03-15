import { Router } from "express"
import { verifyToken } from "../middlewares/auth.middleware.js"
import { get_zone_by_qr, get_incident_types, create_maintenance_report, get_pending_tasks, get_recent_inspections, get_recent_reports } from "../controllers/maintenance.controller.js"

const router = Router();

// Rutas fijas primero para evitar choques con '/:qr_code'
router.get('/incident-types', verifyToken, get_incident_types)
router.get('/pending-tasks', verifyToken, get_pending_tasks)
router.get('/inspections/recent', verifyToken, get_recent_inspections)
router.get('/reports/recent', verifyToken, get_recent_reports)
router.get('/:qr_code', verifyToken, get_zone_by_qr)
router.post('/report', verifyToken, create_maintenance_report)
export { router as maintenanceRoutes };