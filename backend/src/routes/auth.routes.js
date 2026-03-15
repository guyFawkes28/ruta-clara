import { Router } from "express";
import { user_login, user_logout, user_register } from "../controllers/auth.controller.js";

const router = Router();

router.post('/register', user_register);
router.post('/login', user_login)
router.post('/logout', user_logout)

export  {router as authRoutes}
