import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    street: { type: String },
    district: { type: String },
    city: { type: String },
  },
  { _id: false } // không cần tạo _id cho subdocument
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    cartData: {
      type: Object,
      default: {},
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    phone: {
      type: String,
      default: "",
    },

    address: {
      type: addressSchema,
      default: {},
    },
    points: {
      type: Number,
      default: 0,
    },
  },
  { minimize: false, timestamps: true }
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;
