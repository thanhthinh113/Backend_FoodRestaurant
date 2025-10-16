import express from "express";

import {
  createVoucher,
  getAllVouchers,
  deleteVoucher,
  redeemVoucher,
} from "../controllers/voucherController.js";

const voucherRouter = express.Router();

// 🧾 Admin tạo voucher mới
voucherRouter.post("/create", createVoucher);

// 📋 Admin hoặc user xem danh sách voucher (public)
voucherRouter.get("/list", getAllVouchers);

// 🎟️ User đổi điểm lấy voucher
voucherRouter.post("/redeem", redeemVoucher);

// ❌ Admin xóa voucher
voucherRouter.delete("/delete/:id", deleteVoucher);

export default voucherRouter;
