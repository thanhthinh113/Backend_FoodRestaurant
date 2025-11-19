import express from "express";
import {
  addReview,
  getReviewsByFood,
  canReview,
  getPresignedUrl,
  adminReaction,
  adminReply,
} from "../controllers/reviewController.js";
import authMiddleware from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// Upload S3
router.post("/presign", authMiddleware, getPresignedUrl);

// ⭐ Phải đặt route có prefix trước nếu không sẽ bị nuốt route
router.get("/can/:foodId", authMiddleware, canReview);

// ⭐ Admin reaction + reply
router.post("/reaction/:reviewId", authMiddleware, adminAuth, adminReaction);
router.post("/reply/:reviewId", authMiddleware, adminAuth, adminReply);

// User review
router.post("/", authMiddleware, addReview);

// ⭐ Cuối cùng mới đến :foodId
router.get("/:foodId", getReviewsByFood);

export default router;
