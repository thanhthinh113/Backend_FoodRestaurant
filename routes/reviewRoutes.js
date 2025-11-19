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

router.post("/presign", authMiddleware, getPresignedUrl);
router.get("/can/:foodId", authMiddleware, canReview);
router.post("/reaction/:reviewId", authMiddleware, adminAuth, adminReaction);
router.post("/reply/:reviewId", authMiddleware, adminAuth, adminReply);
router.post("/", authMiddleware, addReview);
router.get("/:foodId", getReviewsByFood);

export default router;
