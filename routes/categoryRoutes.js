import express from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../config/s3.js";
import Category from "../models/categoryModel.js";

const router = express.Router();

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    key: function (req, file, cb) {
      const fileName = Date.now().toString() + "-" + file.originalname;
      cb(null, fileName);
    },
  }),
});

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, description } = req.body;

    const newCategory = new Category({
      name,
      description,
      imageUrl: req.file?.location,
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).json({ error: "Failed to create category" });
  }
});

router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    // Nếu có ảnh mới -> xóa ảnh cũ khỏi S3
    if (req.file && category.imageUrl) {
      const oldKey = category.imageUrl.split("/").pop(); // lấy tên file từ URL
      await s3
        .deleteObject({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: oldKey,
        })
        .promise();
    }

    category.name = name || category.name;
    category.description = description || category.description;
    if (req.file) category.imageUrl = req.file.location;

    await category.save();
    res.json(category);
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).json({ error: "Failed to update category" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    if (category.imageUrl) {
      const key = category.imageUrl.split("/").pop();
      await s3
        .deleteObject({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
        })
        .promise();
    }

    await category.deleteOne();
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
