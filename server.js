import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./config/cloudinary.js";

dotenv.config();

const app = express();

/* -------------------- MIDDLEWARES -------------------- */
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* -------------------- HEALTH CHECK (RENDER) -------------------- */
app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "OK" });
});

/* -------------------- MONGODB CONNECTION -------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

/* -------------------- SCHEMAS -------------------- */
const blogSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    description: String,
    image: String,
    video: String,
    category: String,
  },
  { timestamps: true }
);

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const Blog = mongoose.model("Blog", blogSchema);
const Admin = mongoose.model("Admin", adminSchema);

/* -------------------- MULTER + CLOUDINARY -------------------- */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blogs",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files allowed"));
    }
    cb(null, true);
  },
});

/* -------------------- ADMIN LOGIN -------------------- */
app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    let admin = await Admin.findOne();
    if (!admin) {
      admin = await Admin.create({
        username: "admin",
        password: "admin123",
      });
    }

    if (
      username?.trim() === admin.username &&
      password?.trim() === admin.password
    ) {
      return res.json({ success: true });
    }

    res.status(401).json({ success: false });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* -------------------- BLOG ROUTES -------------------- */

// GET all blogs
app.get("/blogs", async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json(blogs);
});

// GET single blog
app.get("/blogs/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid blog ID" });
  }

  const blog = await Blog.findById(req.params.id);
  res.json(blog || {});
});

// CREATE blog
app.post("/blogs", upload.single("image"), async (req, res) => {
  try {
    const blog = await Blog.create({
      title: req.body.title,
      content: req.body.content,
      description: req.body.description,
      category: req.body.category,
      video: req.body.video,
      image: req.file ? req.file.path : "", // Cloudinary URL
    });

    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: "Failed to add blog" });
  }
});

// UPDATE blog
app.put("/blogs/:id", upload.single("image"), async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid blog ID" });
  }

  try {
    const updateData = {
      title: req.body.title,
      content: req.body.content,
      description: req.body.description,
      category: req.body.category,
      video: req.body.video,
    };

    if (req.file) {
      updateData.image = req.file.path;
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!blog) return res.status(404).json({ error: "Blog not found" });

    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: "Failed to update blog" });
  }
});

// DELETE blog
app.delete("/blogs/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid blog ID" });
  }

  const deleted = await Blog.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Blog not found" });

  res.json({ success: true });
});

/* -------------------- SERVER -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

