import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";

import { connectDB } from "./config/db.js";
import { initSocket } from "./socket.js";

// Routers
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import comboRoutes from "./routes/comboRoutes.js";
import adminStatsRouter from "./routes/adminStats.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import voucherRouter from "./routes/voucherRoute.js";
import analyticsRouter from "./routes/analiticsRoute.js";
import contactRouter from "./routes/contactRoutes.js";
import notificationRouter from "./routes/notificationRoute.js";
import uploadRoutes from "./routes/uploadRoutes.js";

// App config
const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use("/images", express.static("uploads"));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// DB connection
connectDB();

// API routes
app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/categories", categoryRoutes);
app.use("/api/combos", comboRoutes);
app.use("/api/admin/stats", adminStatsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/reviews", reviewRoutes);
app.use("/api/voucher", voucherRouter);
app.use("/api/contact", contactRouter);
app.use("/api", uploadRoutes);
app.use("/api/notifications", notificationRouter);

app.get("/", (req, res) => res.send("API Working!"));

// --- HTTP server + Socket.IO ---
const server = http.createServer(app);
initSocket(server); // gắn socket

// Listen bằng server chứ không phải app
server.listen(port, () =>
  console.log(`Server is running on http://localhost:${port}`)
);
