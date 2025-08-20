import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose
    .connect(
    )
    .then(
      () => {
        console.log("MongoDB connected successfully");
      },
      (err) => {
        console.error("MongoDB connection error:", err);
      }
    );
};
