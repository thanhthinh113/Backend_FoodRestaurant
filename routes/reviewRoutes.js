import express from "express";
import { addReview, getReviewsByFood } from "../controllers/reviewController.js";

const router = express.Router();

// ✅ Thêm đánh giá
router.post("/", addReview);

// ✅ Lấy danh sách đánh giá của món ăn
router.get("/:foodId", getReviewsByFood);

export default router;
