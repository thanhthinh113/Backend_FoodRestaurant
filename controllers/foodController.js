import Food from "../models/foodModel.js";


// Lấy toàn bộ danh sách món ăn
export const listFood = async (req, res) => {
  try {
    const foods = await Food.find().populate("categoryId", "name");
    res.json({ success: true, data: foods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔍 Tìm kiếm món ăn theo tên hoặc mô tả
export const searchFoods = async (req, res) => {
  try {
    const { q } = req.query; // lấy từ query string ?q=pizza
    if (!q) {
      return res.status(400).json({ success: false, message: "Thiếu từ khóa tìm kiếm" });
    }

    // tìm theo name hoặc description (không phân biệt hoa thường)
    const results = await Food.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    }).populate("categoryId", "name");

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getFoodById = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id).populate(
      "categoryId",
      "name"
    );
    if (!food) {
      return res.status(404).json({ message: "Không tìm thấy món ăn" });
    }
    res.json(food); // 👈 trả về trực tiếp object food
  } catch (err) {
    console.error("Error fetching food:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
// Thêm món
export const createFood = async (req, res) => {
  try {
    const { name, description, price, categoryId } = req.body;
    // const image = req.file ? "images/" + req.file.filename : "";
    const image = req.file ? "uploads/" + req.file.filename : "";
    const newFood = new Food({
      name,
      description,
      price,
      image,
      categoryId,
    });

    await newFood.save();
    res.json({ success: true, data: newFood });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Cập nhật món
export const updateFood = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId } = req.body;
    const updateData = { name, description, price, categoryId };

    if (req.file) {
      updateData.image = "images/" + req.file.filename;
    }

    const updated = await Food.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Xoá món
export const deleteFood = async (req, res) => {
  try {
    const { id } = req.params;
    await Food.findByIdAndDelete(id);
    res.json({ success: true, message: "Đã xoá món ăn" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
