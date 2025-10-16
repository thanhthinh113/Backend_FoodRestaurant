import express from "express";
import { getAdminStats } from "../controllers/adminStatsController.js";
import adminAuth from "../middleware/adminAuth.js";


const router = express.Router();

router.get("/stats", adminAuth, getAdminStats);

export default router;
