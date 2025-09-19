// import mongoose from "mongoose";

// const categorySchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     description: {
//       type: String,
//       default: "",
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Category", categorySchema);
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;
