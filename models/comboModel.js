import mongoose from "mongoose";

const comboSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    // items lưu object: { food: ObjectId, quantity: Number }
    items: [
      {
        food: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true },
        quantity: { type: Number, default: 1 },
      },
    ],
    image: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Combo", comboSchema);
