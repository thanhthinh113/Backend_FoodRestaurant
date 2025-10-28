import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getSummary } from "../controllers/AnaliticsController.js";

const analyticsRouter = express.Router();

// Route này thường chỉ dành cho Admin, nên cần thêm middleware kiểm tra quyền
analyticsRouter.get("/summary", authMiddleware, getSummary);

export default analyticsRouter;
