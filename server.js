import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import blogRoutes from "./routes/blogRoutes.js"; // ✅ KEEP THIS

dotenv.config();

const app = express();

/* MIDDLEWARE */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ✅ HEALTH CHECK (RENDER FIX) */
app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "OK" });
});

/* DB */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

/* ✅ ROUTES */
app.use("/blogs", blogRoutes);

/* ROOT */
app.get("/", (req, res) => {
  res.send("API Running");
});

/* SERVER */
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});