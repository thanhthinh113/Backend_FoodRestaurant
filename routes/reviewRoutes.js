import express from "express";
import {
  addReview,
  getReviewsByFood,
  canReview,
  getPresignedUrl,
} from "../controllers/reviewController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// ✅ Route xin URL upload S3
router.post("/presign", authMiddleware, getPresignedUrl);

// ✅ Đánh giá
router.post("/", authMiddleware, addReview);
router.get("/:foodId", getReviewsByFood);
router.get("/can/:foodId", authMiddleware, canReview);

export default router;
