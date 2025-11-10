// routes/comboRouter.js
import express from "express";
import multer from "multer";
import {
  createCombo,
  listCombos,
  updateCombo,
  deleteCombo,
} from "../controllers/comboControler.js";

const router = express.Router();

// Dùng memoryStorage để upload thẳng buffer lên S3
const upload = multer({ storage: multer.memoryStorage() });

// REST API chuẩn
router.get("/", listCombos);
router.post("/", upload.single("image"), createCombo);
router.put("/:id", upload.single("image"), updateCombo);
router.delete("/:id", deleteCombo);

export default router;
