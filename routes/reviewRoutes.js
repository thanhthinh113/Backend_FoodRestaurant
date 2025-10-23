import express from "express";
import {
  addReview,
  getReviewsByFood,
  canReview,
} from "../controllers/reviewController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, addReview);
router.get("/:foodId", getReviewsByFood);
router.get("/can/:foodId", authMiddleware, canReview);

export default router;
