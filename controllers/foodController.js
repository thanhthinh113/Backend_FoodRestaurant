// import Food from "../models/foodModel.js";

// // Create food
// export const createFood = async (req, res) => {
//   try {
//     const { name, price, description, category } = req.body;
//     const image = req.file ? req.file.filename : null;

//     const food = await Food.create({
//       name,
//       price,
//       description,
//       category,
//       image,
//     });

//     res
//       .status(201)
//       .json({ success: true, data: food, message: "Food created" });
//   } catch (error) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

// // Get all foods
// export const getFoods = async (req, res) => {
//   try {
//     const foods = await Food.find().populate("category", "name");
//     res.json({ success: true, data: foods });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get single food
// export const getFoodById = async (req, res) => {
//   try {
//     const food = await Food.findById(req.params.id).populate(
//       "category",
//       "name"
//     );
//     if (!food)
//       return res
//         .status(404)
//         .json({ success: false, message: "Food not found" });
//     res.json({ success: true, data: food });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Update food
// export const updateFood = async (req, res) => {
//   try {
//     const { name, price, description, category } = req.body;
//     const updateData = { name, price, description, category };

//     if (req.file) {
//       updateData.image = req.file.filename;
//     }

//     const food = await Food.findByIdAndUpdate(req.params.id, updateData, {
//       new: true,
//     }).populate("category", "name");

//     if (!food)
//       return res
//         .status(404)
//         .json({ success: false, message: "Food not found" });
//     res.json({ success: true, data: food, message: "Food updated" });
//   } catch (error) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

// // Delete food
// export const deleteFood = async (req, res) => {
//   try {
//     const { id } = req.body; // FE đang gửi POST với {id}
//     const food = await Food.findByIdAndDelete(id);
//     if (!food)
//       return res
//         .status(404)
//         .json({ success: false, message: "Food not found" });
//     res.json({ success: true, message: "Food deleted" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
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
export const getFoodById = async (req, res) => {
  try {
    const { id } = req.params;
    const food = await Food.findById(id).populate("categoryId", "name");
    if (!food) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy món ăn" });
    }
    res.json({ success: true, data: food });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
