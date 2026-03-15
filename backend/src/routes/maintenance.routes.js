import { Router } from "express"
import { verifyToken } from "../middlewares/auth.middleware.js"
import { getZonasByQr, getTiposIncidencia, crearReporteMantenimiento, getPendingTasks, getRecentInspections, getRecentReports } from "../controllers/maintenance.controller.js"

const router = Router();

// Rutas estáticas primero para evitar que 
// la ruta dinámica '/:qr_code' capture solicitudes como '/incidencias'
router.get('/incidencias', verifyToken, getTiposIncidencia)
router.get('/pendientes', verifyToken, getPendingTasks)
router.get('/inspecciones/recientes', verifyToken, getRecentInspections)
router.get('/reportes/recientes', verifyToken, getRecentReports)
router.get('/:qr_code', verifyToken, getZonasByQr)
router.post('/reportar', verifyToken, crearReporteMantenimiento)
export { router as maintenanceRoutes };