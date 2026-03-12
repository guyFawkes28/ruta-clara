import { Router } from "express"
import { verifyToken } from "../middlewares/auth.middleware.js"


const router = Router()

router.get('/:qr_code',verifyToken)



export {router as maintenanceRoutes}