import express from "express";
import {
  addFood,
  listFood,
  removeFood,
} from "../controllers/foodController.js";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";

const foodRouter = express.Router();

//Image Storage Engine
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

const checkUserId = (req, res, next) => {
  console.log("User ID from token:", req.body.userId);
  next();
};

foodRouter.post(
  "/add",
  authMiddleware,
  checkUserId,
  adminAuth,
  upload.single("image"),
  addFood
);
foodRouter.get("/list", authMiddleware, listFood);
foodRouter.post("/remove", authMiddleware, adminAuth, removeFood);

export default foodRouter;
