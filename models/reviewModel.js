import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: "" },
  media: { type: String, default: null }, // ✅ thêm dòng này để lưu URL ảnh/video
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Review", reviewSchema);
