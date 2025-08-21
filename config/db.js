import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_DB).then(
    () => {
      console.log("MongoDB connected successfully");
    },
    (err) => {
      console.error("MongoDB connection error:", err);
    }
  );
};
