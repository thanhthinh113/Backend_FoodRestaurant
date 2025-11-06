import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otpCode: { type: String, required: true },
  otpExpires: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // TTL index: 600s = 10 phút
});

const pendingUserModel = mongoose.model("pendingUser", pendingUserSchema);
export default pendingUserModel;
