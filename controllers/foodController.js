import foodModel from "../models/foodModel.js";
import fs from "fs";

// add food item

const addFood = async (req, res) => {
  let image_filename = `${req.file.filename}`;

  const food = new foodModel({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    category: req.body.category,
    image: image_filename,
  });
  try {
    await food.save();
    res.json({
      success: true,
      message: "Food item added successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Failed to add food item",
    });
  }
};

// all food items
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({});
    res.json({
      success: true,
      data: foods,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Failed to retrieve food items",
    });
  }
};

// remove food item
const removeFood = async (req, res) => {
  try {
    const food = await foodModel.findByIdAndDelete(req.body.id);
    fs.unlink(`uploads/${food.image}`, () => {});

    await foodModel.findByIdAndDelete(req.body.id);
    res.json({
      success: true,
      message: "Food item removed successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Failed to remove food item",
    });
  }
};
const updateFood = async (req, res) => {
  try {
    const { id, name, description, price, category } = req.body;

    // lấy food hiện tại
    const food = await foodModel.findById(id);
    if (!food) {
      return res.json({ success: false, message: "Food item not found" });
    }

    // nếu có upload ảnh mới thì xóa ảnh cũ
    if (req.file) {
      fs.unlink(`uploads/${food.image}`, () => {});
      food.image = req.file.filename;
    }

    // cập nhật các field còn lại
    food.name = name || food.name;
    food.description = description || food.description;
    food.price = price || food.price;
    food.category = category || food.category;

    await food.save();

    res.json({
      success: true,
      message: "Food item updated successfully",
      data: food,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Failed to update food item",
    });
  }
};

export { addFood, listFood, removeFood, updateFood };
