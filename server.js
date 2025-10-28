import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import "dotenv/config";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import bodyParser from "body-parser";
import categoryRoutes from "./routes/categoryRoutes.js";
import comboRoutes from "./routes/comboRoutes.js";
import adminStatsRouter from "./routes/adminStats.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import path from "path";
import voucherRouter from "./routes/voucherRoute.js";
import analyticsRouter from "./routes/analiticsRoute.js";

// app config
const app = express();
const port = 4000;

// middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

// db connection
connectDB();

// api endpoints
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/categories", categoryRoutes);
app.use("/api/combos", comboRoutes);
app.use("/api/admin/stats", adminStatsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/reviews", reviewRoutes);
app.use("/api/voucher", voucherRouter);

app.get("/", (req, res) => res.send("API Working!"));

app.listen(port, () =>
  console.log(`Server is running on http://localhost:${port}`)
);
