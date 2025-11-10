// controllers/comboController.js
import Combo from "../models/comboModel.js";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// 🧠 Upload ảnh combo lên S3
const uploadToS3 = async (file) => {
  if (!file) return null;
  const fileName = `combos/${Date.now()}_${file.originalname}`;
  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };
  await s3.send(new PutObjectCommand(uploadParams));
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
};

// 📦 Lấy danh sách combo
export const listCombos = async (req, res) => {
  try {
    const combos = await Combo.find().populate("items");
    res.json(combos);
  } catch (error) {
    res.status(500).json({ message: "Error fetching combos", error });
  }
};

// ➕ Thêm combo mới (upload ảnh lên S3)
export const createCombo = async (req, res) => {
  try {
    const { name, description, price, discountPrice, items } = req.body;

    const imageUrl = req.file ? await uploadToS3(req.file) : "";

    const combo = new Combo({
      name,
      description,
      price,
      discountPrice,
      items: items ? JSON.parse(items) : [],
      image: imageUrl,
    });

    await combo.save();
    res.json(combo);
  } catch (error) {
    res.status(400).json({ message: "Error creating combo", error });
  }
};

// ✏️ Sửa combo
export const updateCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, discountPrice, items } = req.body;
    const updateData = {
      name,
      description,
      price,
      discountPrice,
      items: items ? JSON.parse(items) : [],
    };

    if (req.file) {
      const imageUrl = await uploadToS3(req.file);
      updateData.image = imageUrl;
    }

    const combo = await Combo.findByIdAndUpdate(id, updateData, { new: true });
    res.json(combo);
  } catch (error) {
    res.status(400).json({ message: "Error updating combo", error });
  }
};

// ❌ Xóa combo (và xoá ảnh khỏi S3)
export const deleteCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const combo = await Combo.findByIdAndDelete(id);

    if (!combo)
      return res.status(404).json({ message: "Không tìm thấy combo" });

    // Nếu ảnh nằm trong S3 thì xoá luôn
    if (combo.image && combo.image.includes(BUCKET_NAME)) {
      const key = combo.image.split(".amazonaws.com/")[1];
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    }

    res.json({ message: "Combo deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting combo", error });
  }
};
