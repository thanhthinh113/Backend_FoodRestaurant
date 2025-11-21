import userModel from "../models/userModel.js";

const addToCart = async (req, res) => {
  try {
    const { userId, itemId, quantity = 1 } = req.body;

    const userData = await userModel.findById(userId);
    const cartData = userData.cartData || {};

    if (!cartData[itemId]) {
      cartData[itemId] = quantity;
    } else {
      cartData[itemId] += quantity;
    }

    await userModel.findByIdAndUpdate(userId, { cartData });

    return res.json({
      success: true,
      message: "Đồ ăn đã được thêm vào giỏ hàng",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Không thể thêm đồ ăn vào giỏ hàng",
    });
  }
};

// remove from cart
const removeFromCart = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    let cartData = await userData.cartData;
    if (cartData[req.body.itemId] > 0) {
      cartData[req.body.itemId] -= 1;
    }
    await userModel.findByIdAndUpdate(req.body.userId, { cartData });
    res.json({
      success: true,
      message: "Item removed from cart successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Failed to remove item from cart",
    });
  }
};

// fetch cart items

const getCart = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    let cartData = await userData.cartData;

    res.json({
      success: true,
      cartData,
      message: "Cart items fetched successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Failed to fetch cart items",
    });
  }
};

export { addToCart, removeFromCart, getCart };
