import mongoose from "mongoose";

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

export default mongoose.model("Blog", blogSchema);