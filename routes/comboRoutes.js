import express from "express";
import multer from "multer";
import Combo from "../models/comboModel.js";

const router = express.Router();

// Multer config (lưu ảnh vào /uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Lấy tất cả combo
router.get("/", async (req, res) => {
  try {
    const combos = await Combo.find().populate("items");
    res.json(combos);
  } catch (error) {
    res.status(500).json({ message: "Error fetching combos", error });
  }
});

// Thêm combo
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, discountPrice, items } = req.body;
    const combo = new Combo({
      name,
      description,
      price,
      discountPrice,
      items: items ? JSON.parse(items) : [],
      image: req.file ? req.file.filename : "",
    });
    await combo.save();
    res.json(combo);
  } catch (error) {
    res.status(400).json({ message: "Error creating combo", error });
  }
});

// Sửa combo
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, discountPrice, items } = req.body;
    const updateData = {
      name,
      description,
      price,
      discountPrice,
      items: items ? JSON.parse(items) : [],
    };
    if (req.file) updateData.image = req.file.filename;

    const combo = await Combo.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    res.json(combo);
  } catch (error) {
    res.status(400).json({ message: "Error updating combo", error });
  }
});

// Xóa combo
router.delete("/:id", async (req, res) => {
  try {
    await Combo.findByIdAndDelete(req.params.id);
    res.json({ message: "Combo deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting combo", error });
  }
});

export default router;
