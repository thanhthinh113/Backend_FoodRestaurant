import express from "express";
import multer from "multer";
import {
  createFood,
  listFood,
  getFoodById,
  updateFood,
  deleteFood,
  searchFoods,
} from "../controllers/foodController.js";

const router = express.Router();

// dùng memoryStorage vì ta upload thẳng buffer lên S3
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Route cho FE cũ
router.post("/add", upload.single("image"), createFood);
router.get("/list", listFood);
router.post("/remove", deleteFood);

// ✅ Route RESTful mới
router.get("/search", searchFoods); // ⚠️ đặt TRƯỚC /:id
router.post("/", upload.single("image"), createFood);
router.get("/", listFood);
router.get("/:id", getFoodById);
router.put("/:id", upload.single("image"), updateFood);
router.delete("/:id", deleteFood);

export default router;
