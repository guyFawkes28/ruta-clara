import express from 'express'
import {
  create_transfer,
  get_transfer_history,
  get_transfers_by_zone,
  get_mobile_assets_by_zone
} from '../controllers/transfer.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'

const router = express.Router()

// POST: Registrar traslado
router.post('/create', verifyToken, create_transfer)

// GET: Historial de activo específico
router.get('/history/:activo_id', verifyToken, get_transfer_history)

// GET: Traslados por zona
router.get('/by-zone', verifyToken, get_transfers_by_zone)

// GET: Activos móviles en zona
router.get('/mobile-assets', verifyToken, get_mobile_assets_by_zone)

export const transferRoutes = router
