import Category from "../models/categoryModel.js";
import fs from "fs";
import path from "path";

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const imagePath = req.file ? `uploads/${req.file.filename}` : null;

    const category = new Category({
      name,
      description,
      image: imagePath,
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.name = name || category.name;
    category.description = description || category.description;

    if (req.file) {
      // Xóa ảnh cũ nếu có
      if (category.image) {
        const oldPath = path.join(process.cwd(), category.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      category.image = `uploads/${req.file.filename}`;
    }

    await category.save();
    res.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Xóa ảnh trong thư mục uploads
    if (category.image) {
      const oldPath = path.join(process.cwd(), category.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await category.deleteOne();
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Server error" });
  }
};
