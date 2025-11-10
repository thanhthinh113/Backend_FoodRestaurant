import express from "express";
import multer from "multer";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

// Multer lưu file vào memory để upload lên S3
const upload = multer({ storage: multer.memoryStorage() });

// Routes
router.post("/", upload.single("image"), createCategory);
router.get("/", getCategories);
router.put("/:id", upload.single("image"), updateCategory);
router.delete("/:id", deleteCategory);

export default router;
