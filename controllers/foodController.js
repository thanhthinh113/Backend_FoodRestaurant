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

// Lấy chi tiết 1 món ăn theo id
// export const getFoodById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const food = await Food.findById(id).populate("categoryId", "name");
//     if (!food) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Không tìm thấy món ăn" });
//     }
//     res.json({ success: true, data: food });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
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
    const image = req.file ? "images/" + req.file.filename : "";

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
