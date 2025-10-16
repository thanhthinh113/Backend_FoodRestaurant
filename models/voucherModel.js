import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // Mã voucher (VD: DISCOUNT10)
    discountPercent: { type: Number, required: true }, // phần trăm giảm (VD: 10%)
    pointsRequired: { type: Number, required: true }, // điểm cần để đổi
    expiryDate: { type: Date, required: true }, // ngày hết hạn
    isActive: { type: Boolean, default: true }, // có còn sử dụng được không
  },
  { timestamps: true }
);

const voucherModel =
  mongoose.models.voucher || mongoose.model("voucher", voucherSchema);

export default voucherModel;
