import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import Blog from "../models/Blog.js";

const router = express.Router();

/* MULTER MEMORY STORAGE */
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    console.log("UPLOAD FILE:", file);
    cb(null, true);
  },
});

/* UPLOAD TO CLOUDINARY */
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "blogs" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

/* CREATE BLOG */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    // ✅ ADD HERE (VERY IMPORTANT)
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    let imageUrl = "";

    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    const result = await uploadToCloudinary(req.file.buffer);
    imageUrl = result.secure_url;

    const blog = await Blog.create({
      title: req.body.title,
      description: req.body.description,
      content: req.body.content,
      category: req.body.category,
      video: req.body.video,
      image: imageUrl,
    });

    res.json(blog);
  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
/* GET BLOGS */
router.get("/", async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json(blogs);
});

/* DELETE BLOG */
router.delete("/:id", async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

/* UPDATE BLOG */
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      updateData.image = result.secure_url;
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(blog);
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;