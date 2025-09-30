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
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/categories", categoryRoutes);
app.use("/api/combos", comboRoutes);

app.get("/", (req, res) => res.send("API Working!"));

app.listen(port, () =>
  console.log(`Server is running on http://localhost:${port}`)
);
