import mongoose from "mongoose";

const comboSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // tên combo
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    discountPrice: { type: Number }, // giá sau giảm
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Food" }], // các món trong combo
    image: { type: String }, // ảnh combo
  },
  { timestamps: true }
);

export default mongoose.model("Combo", comboSchema);
