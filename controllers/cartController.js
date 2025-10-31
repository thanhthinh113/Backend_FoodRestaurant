import userModel from "../models/userModel.js";

// 🛒 Thêm sản phẩm vào giỏ
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id; // lấy từ token
    const { itemId, type = "food", quantity = 1 } = req.body;

    const userData = await userModel.findById(userId);
    let cartData = userData.cartData || {};

    const key = `${type}_${itemId}`;

    cartData[key] = (cartData[key] || 0) + Number(quantity);

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "✅ Item added to cart successfully" });
  } catch (error) {
    console.error("❌ Add to cart error:", error);
    res.status(500).json({ success: false, message: "Failed to add item to cart" });
  }
};

// 🗑️ Xóa sản phẩm khỏi giỏ
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, type = "food" } = req.body;

    const userData = await userModel.findById(userId);
    let cartData = userData.cartData || {};
    const key = `${type}_${itemId}`;

    if (cartData[key]) delete cartData[key];

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "✅ Item removed from cart successfully" });
  } catch (error) {
    console.error("❌ Remove from cart error:", error);
    res.status(500).json({ success: false, message: "Failed to remove item from cart" });
  }
};

// 🔁 Cập nhật số lượng
const updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, type = "food", quantity = 1 } = req.body;
    const key = `${type}_${itemId}`;

    const userData = await userModel.findById(userId);
    let cartData = userData.cartData || {};

    if (quantity > 0) cartData[key] = Number(quantity);
    else delete cartData[key];

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "✅ Cart updated successfully" });
  } catch (error) {
    console.error("❌ Update cart error:", error);
    res.status(500).json({ success: false, message: "Failed to update cart" });
  }
};

// 📦 Lấy dữ liệu giỏ hàng
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const userData = await userModel.findById(userId);
    const cartData = userData.cartData || {};

    res.json({
      success: true,
      cartData,
      message: "✅ Cart items fetched successfully",
    });
  } catch (error) {
    console.error("❌ Get cart error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch cart items" });
  }
};

// 🧹 Xóa toàn bộ giỏ hàng
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    await userModel.findByIdAndUpdate(userId, { cartData: {} });
    res.json({ success: true, message: "🧹 Cart cleared successfully" });
  } catch (error) {
    console.error("❌ Clear cart error:", error);
    res.status(500).json({ success: false, message: "Failed to clear cart" });
  }
};

export { addToCart, removeFromCart, updateCart, getCart, clearCart };
