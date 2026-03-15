import { Router } from "express";
import { create_cleaning, get_cleanings, get_current_cleaning_info } from '../controllers/cleaning.controller.js';

const router = Router();

router.post("/cleaning", create_cleaning);

router.get("/cleanings", get_cleanings);

router.get("/cleanings/info", get_current_cleaning_info);

export default router;