// routes/uploadRoutes.js
import express from "express";
import { generateUploadURL } from "../config/s3.js";

const router = express.Router();

router.get("/upload-url", async (req, res) => {
  try {
    const { fileName, fileType } = req.query;
    const uploadUrl = await generateUploadURL(fileName, fileType);

    // ✅ Tạo URL public (đường dẫn thực tế tới S3)
    const fileUrl = `https://iamge-food.s3.us-east-1.amazonaws.com/${fileName}`;

    res.json({ uploadUrl, fileUrl }); // ✅ gửi cả 2 về FE
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo URL upload", error: err.message });
  }
});

export default router;
