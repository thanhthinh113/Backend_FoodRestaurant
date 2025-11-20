// controllers/comboController.js
import Combo from "../models/comboModel.js";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import Food from "../models/foodModel.js";
dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// Upload ảnh combo lên S3
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

// Lấy danh sách combo (populate food details)
export const listCombos = async (req, res) => {
  try {
    // populate nested food inside items
    const combos = await Combo.find().populate("items.food");
    res.json(combos);
  } catch (error) {
    res.status(500).json({ message: "Error fetching combos", error });
  }
};

// Tạo combo mới
export const createCombo = async (req, res) => {
  try {
    const { name, description, price, discountPrice, items } = req.body;

    const imageUrl = req.file ? await uploadToS3(req.file) : "";

    // items expected as JSON string of [{ id, quantity }]
    const parsedItems = items ? JSON.parse(items) : [];

    // convert to stored format: { food: ObjectId, quantity }
    const itemsToSave = parsedItems.map((it) => ({
      food: it.id,
      quantity: it.quantity || 1,
    }));

    const combo = new Combo({
      name,
      description,
      price,
      discountPrice,
      items: itemsToSave,
      image: imageUrl,
    });

    await combo.save();
    // return populated combo
    const saved = await Combo.findById(combo._id).populate("items.food");
    res.json(saved);
  } catch (error) {
    console.error("createCombo error:", error);
    res.status(400).json({ message: "Error creating combo", error });
  }
};

// Update combo
export const updateCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, discountPrice, items } = req.body;
    const updateData = {
      name,
      description,
      price,
      discountPrice,
    };

    if (req.file) {
      const imageUrl = await uploadToS3(req.file);
      updateData.image = imageUrl;
    }

    const parsedItems = items ? JSON.parse(items) : [];
    updateData.items = parsedItems.map((it) => ({
      food: it.id,
      quantity: it.quantity || 1,
    }));

    const combo = await Combo.findByIdAndUpdate(id, updateData, { new: true });
    const populated = await Combo.findById(combo._id).populate("items.food");
    res.json(populated);
  } catch (error) {
    console.error("updateCombo error:", error);
    res.status(400).json({ message: "Error updating combo", error });
  }
};

// Delete combo
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
