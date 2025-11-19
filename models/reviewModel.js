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

  media: { type: String, default: null },

  reaction: {
    type: String,
    enum: ["👍", "❤️", "😂", "😡", null],
    default: null,
  },
  reply: {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    adminName: { type: String, default: null },
    text: { type: String, default: null },
    createdAt: { type: Date, default: null },
  },

  createdAt: { type: Date, default: Date.now },
});
<<<<<<< HEAD

export default mongoose.model("Review", reviewSchema);
=======
const reviewModel =
  mongoose.models.review || mongoose.model("review", reviewSchema);
export default reviewModel;
>>>>>>> d79f07f02f2ad2e6f1f997ff0220a0731e6fbf8f
