import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image: String,
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
});

export default mongoose.model("Food", foodSchema);
