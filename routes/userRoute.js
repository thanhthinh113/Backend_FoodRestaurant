import express from "express";
import {
  getAllUsers,
  loginUser,
  registerUser,
  updateProfile,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
const userRouter = express.Router();

userRouter.post("/login", loginUser);
userRouter.post("/register", registerUser);
userRouter.get("/all", authMiddleware, adminAuth, getAllUsers);
userRouter.post("/update-profile", authMiddleware, updateProfile);

export default userRouter;
