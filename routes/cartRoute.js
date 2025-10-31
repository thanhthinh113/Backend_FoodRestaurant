import express from "express";
import {
  addToCart,
  removeFromCart,
  updateCart,
  getCart,
  clearCart,
} from "../controllers/cartController.js";
import authMiddleware from "../middleware/auth.js";

const cartRouter = express.Router();

cartRouter.post("/add", authMiddleware, addToCart);
cartRouter.post("/remove", authMiddleware, removeFromCart);
cartRouter.post("/update", authMiddleware, updateCart);
cartRouter.get("/get", authMiddleware, getCart);
cartRouter.post("/clear", authMiddleware, clearCart);

export default cartRouter;
