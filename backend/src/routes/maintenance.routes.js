import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { getZonasByQr } from "../controllers/maintenance.controller.js";

const router = Router();

router.get('/:qr_code', verifyToken, getZonasByQr)

export { router as maintenanceRoutes };