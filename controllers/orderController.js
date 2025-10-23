import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const placeOrder = async (req, res) => {
  const frontend_url = "http://localhost:5173";

  try {
    const newOrder = new orderModel({
      userId: req.body.userId,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
    });
    await newOrder.save();
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    const line_items = req.body.items.map((item) => ({
      price_data: {
        currency: "vnd",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }));

    line_items.push({
      price_data: {
        currency: "vnd",
        product_data: {
          name: "Delivery Charges",
        },
        unit_amount: 30000,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    });

    res.json({
      success: true,
      message: "Order placed successfully",
      session_url: session.url,
    });
  } catch (error) {
    console.log("❌ Lỗi placeOrder:", error);
    res.json({
      success: false,
      message: "Failed to place order",
    });
  }
};

const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success === "true") {
      const order = await orderModel.findByIdAndUpdate(
        orderId,
        { payment: true, status: "Completed" },
        { new: true }
      );

      const earnedPoints = Math.floor(order.amount / 10000);
      await userModel.findByIdAndUpdate(order.userId, {
        $inc: { points: earnedPoints },
      });

      const updatedUser = await userModel
        .findById(order.userId)
        .select("-password");

      res.json({
        success: true,
        message: "Payment verified and order updated successfully",
        earnedPoints,
        user: updatedUser,
      });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({
        success: false,
        message: "Payment failed, order deleted",
      });
    }
  } catch (error) {
    console.log("❌ Lỗi verifyOrder:", error);
    res.json({
      success: false,
      message: "Error verifying payment",
    });
  }
};

const userOrders = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    console.log("✅ User từ token:", req.user);
    console.log("🔹 userId dùng để truy vấn:", userId);

    const orders = await orderModel.find({ userId });

    console.log("📦 Kết quả truy vấn orders:", orders?.length);
    if (orders?.length > 0) {
      console.log("🧾 Mẫu 1 order:", JSON.stringify(orders[0], null, 2));
    } else {
      console.log("⚠️ Không tìm thấy order nào cho userId:", userId);
    }

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.log("❌ Lỗi userOrders:", error);
    res.json({
      success: false,
      message: "Error fetching user orders",
    });
  }
};

const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.log("❌ Lỗi listOrders:", error);
    res.json({
      success: false,
      message: "Error fetching orders",
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, {
      status: req.body.status,
    });
    res.json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.log("❌ Lỗi updateStatus:", error);
    res.json({
      success: false,
      message: "Error updating order status",
    });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };
