import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import Blog from "../models/Blog.js";

const router = express.Router();

// 🔹 Multer + Cloudinary config
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blogs",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only images allowed"));
    }
    cb(null, true);
  },
});

// ✅ CREATE BLOG
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const blog = await Blog.create({
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      content: req.body.content,
      video: req.body.video,
      image: req.file ? req.file.path : "", // 🔥 Cloudinary URL
    });

    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET BLOGS
router.get("/", async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json(blogs);
});

// ✅ DELETE BLOG
router.delete("/:id", async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ✅ UPDATE BLOG
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = {
      ...req.body,
    };

    if (req.file) {
      updateData.image = req.file.path; // 🔥 Cloudinary URL
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
