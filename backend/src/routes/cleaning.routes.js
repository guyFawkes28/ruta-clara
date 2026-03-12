import { Router } from "express";
import { createCleaning, getCleanings } from "../controllers/cleaning.controller.js";

const router = Router();

router.post("/cleaning", createCleaning);

router.get("/cleanings", getCleanings);

export default router;