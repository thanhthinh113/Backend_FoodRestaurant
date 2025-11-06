import express from "express";
import {
  changePassword,
  forgotPassword,
  getAllUsers,
  getUserProfile,
  loginUser,
  registerUser,
  resetPassword,
  updateProfile,
  verifyEmail,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
const userRouter = express.Router();

userRouter.post("/login", loginUser);
userRouter.post("/register", registerUser);
userRouter.get("/all", authMiddleware, adminAuth, getAllUsers);
userRouter.post("/update-profile", authMiddleware, updateProfile);
userRouter.get("/profile", authMiddleware, getUserProfile);
userRouter.post("/change-password", authMiddleware, changePassword);
userRouter.post("/verify-email", verifyEmail);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);
export default userRouter;
