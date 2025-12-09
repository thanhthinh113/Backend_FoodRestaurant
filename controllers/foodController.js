import Food from "../models/foodModel.js";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

// ✅ Cấu hình AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// 🧠 Hàm upload ảnh lên S3
const uploadToS3 = async (file) => {
  if (!file) return null;
  const fileName = `foods/${Date.now()}_${file.originalname}`;

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3.send(new PutObjectCommand(uploadParams));
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
};

// Lấy toàn bộ danh sách món ăn
export const listFood = async (req, res) => {
  try {
    const foods = await Food.find().populate("categoryId", "name");
    res.json({ success: true, data: foods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔍 Tìm kiếm món ăn theo tên hoặc mô tả
export const searchFoods = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu từ khóa tìm kiếm" });
    }

    const results = await Food.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    }).populate("categoryId", "name");

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFoodById = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id).populate(
      "categoryId",
      "name"
    );
    if (!food) {
      return res.status(404).json({ message: "Không tìm thấy món ăn" });
    }
    res.json(food);
  } catch (err) {
    console.error("Error fetching food:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// ➕ Thêm món ăn (upload ảnh S3)
export const createFood = async (req, res) => {
  try {
    console.log("📦 req.body:", req.body);
    console.log("🖼️ req.file:", req.file);

    const { name, description, price, categoryId, stock } = req.body;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu file ảnh" });
    }

    const imageUrl = await uploadToS3(req.file);

    const newFood = new Food({
      name,
      description,
      price,
      image: imageUrl,
      categoryId,
      stock: Number(stock) || 0,
    });

    await newFood.save();
    res.json({
      success: true,
      message: "Thêm sản phẩm thành công",
      data: newFood,
    });
  } catch (error) {
    console.error("❌ Lỗi khi thêm món:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✏️ Cập nhật món ăn
export const updateFood = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId, stock } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Number(price);
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (stock !== undefined) updateData.stock = Number(stock);

    if (req.file) {
      const imageUrl = await uploadToS3(req.file);
      updateData.image = imageUrl;
    }

    const updated = await Food.findByIdAndUpdate(id, updateData, { new: true });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ❌ Xoá món ăn (và xoá ảnh khỏi S3 nếu có)
export const deleteFood = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu id món ăn" });
    }

    const deleted = await Food.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy món ăn" });
    }

    // Nếu ảnh là từ S3 → xoá ảnh khỏi bucket
    if (deleted.image && deleted.image.includes(BUCKET_NAME)) {
      const key = deleted.image.split(".amazonaws.com/")[1];
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    }

    res.json({ success: true, message: "Đã xoá món ăn" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
