import { Router } from "express";
import { createCleaning, getCleanings, getCurrentCleaningInfo } from "../controllers/cleaning.controller.js";

const router = Router();

router.post("/cleaning", createCleaning);

router.get("/cleanings", getCleanings);

router.get("/cleanings/info", getCurrentCleaningInfo);

export default router;