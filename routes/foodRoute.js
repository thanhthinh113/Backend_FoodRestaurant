import express from "express";
import multer from "multer";
import {
  createFood,
  listFood, // sửa lại từ getFoods → listFood
  getFoodById,
  updateFood,
  deleteFood,
} from "../controllers/foodController.js";

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

/**
 * API cho FE cũ
 * (frontend trước đây đang gọi theo đường dẫn riêng)
 */
router.post("/add", upload.single("image"), createFood); // Thêm món ăn
router.get("/list", listFood); // Lấy danh sách món ăn
router.post("/remove", deleteFood); // Xóa món ăn (FE đang gọi POST với id)

/**
 * API RESTful mới
 */
router.post("/", upload.single("image"), createFood);
router.get("/", listFood);
router.get("/:id", getFoodById);
router.put("/:id", upload.single("image"), updateFood);
router.delete("/:id", deleteFood);

export default router;
