import express from "express";
import { getUploadUrl } from "../controllers/uploadController.js";

const router = express.Router();

// FE gọi: GET /api/upload-url?fileName=abc.jpg&fileType=image/jpeg
router.get("/upload-url", getUploadUrl);

export default router;
