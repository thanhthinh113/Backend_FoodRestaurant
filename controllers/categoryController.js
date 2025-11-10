import Category from "../models/categoryModel.js";
import s3 from "../config/s3.js"; // S3 client
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const REGION = process.env.AWS_REGION;

// 🟢 Tạo danh mục (upload ảnh lên S3)
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    let imageUrl = null;

    if (req.file) {
      const fileExt = req.file.originalname.split(".").pop();
      const s3Key = `categories/${uuidv4()}.${fileExt}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );

      imageUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${s3Key}`;
    }

    const category = new Category({
      name,
      description,
      image: imageUrl,
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟢 Lấy tất cả danh mục
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟢 Cập nhật danh mục (có thể thay ảnh)
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    category.name = name || category.name;
    category.description = description || category.description;

    if (req.file) {
      // Xóa ảnh cũ khỏi S3 (nếu có)
      if (category.image) {
        const match = category.image.match(/https:\/\/[^/]+\/(.+)$/);
        if (match && match[1]) {
          const oldKey = match[1];
          try {
            await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: oldKey }));
          } catch (err) {
            console.warn("⚠️ Xóa ảnh S3 cũ thất bại:", err.message);
          }
        }
      }

      // Upload ảnh mới
      const fileExt = req.file.originalname.split(".").pop();
      const newKey = `categories/${uuidv4()}.${fileExt}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: newKey,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );

      category.image = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${newKey}`;
    }

    await category.save();
    res.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟢 Xóa danh mục (xóa cả ảnh trong S3)
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category)
      return res.status(404).json({ message: "Category not found" });

    if (category.image) {
      const match = category.image.match(/https:\/\/[^/]+\/(.+)$/);
      if (match && match[1]) {
        const key = match[1];
        try {
          await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
        } catch (err) {
          console.warn("⚠️ Xóa ảnh S3 thất bại:", err.message);
        }
      } else {
        console.warn("⚠️ Không tìm thấy key S3 để xóa:", category.image);
      }
    }

    await category.deleteOne();
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Server error" });
  }
};
