import express from 'express'
import {
  createTransfer,
  getTransferHistory,
  getTransfersByZone,
  getMobileAssetsByZone
} from '../controllers/transfer.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js'

const router = express.Router()

// POST: Registrar traslado
router.post('/create', verifyToken, createTransfer)

// GET: Historial de activo específico
router.get('/history/:activo_id', verifyToken, getTransferHistory)

// GET: Traslados por zona
router.get('/by-zone', verifyToken, getTransfersByZone)

// GET: Activos móviles en zona
router.get('/mobile-assets', verifyToken, getMobileAssetsByZone)

export const transferRoutes = router
