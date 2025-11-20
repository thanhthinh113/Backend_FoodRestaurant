import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import { sendOrderStatusUpdate } from "../socket.js";
import notificationModel from "../models/notificationModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const placeOrder = async (req, res) => {
  const frontend_url = process.env.FRONTEND_URL;

  try {
    const { userId, items, amount, address, voucherCode } = req.body;
    let finalAmount = amount;
    let appliedVoucher = null;
    let coupon = null;

    if (voucherCode) {
      const user = await userModel.findById(userId);
      appliedVoucher = user.redeemedVouchers.find(
        (v) => v.code === voucherCode
      );

      if (!appliedVoucher) {
        return res.json({
          success: false,
          message: "Voucher không tồn tại trong tài khoản người dùng",
        });
      }

      if (new Date(appliedVoucher.expiryDate) < new Date()) {
        return res.json({
          success: false,
          message: "Voucher đã hết hạn",
        });
      }

      if (
        appliedVoucher.discountPercent &&
        appliedVoucher.discountPercent > 0
      ) {
        finalAmount = Math.max(amount - appliedVoucher.discountPercent, 0);

        coupon = await stripe.coupons.create({
          currency: "vnd",
          amount_off: appliedVoucher.discountPercent,
          name: `Giảm ${appliedVoucher.discountPercent.toLocaleString(
            "vi-VN"
          )}₫`,
        });
      }
    }

    const newOrder = new orderModel({
      userId,
      items,
      amount: finalAmount,
      address,
      voucherCode: appliedVoucher ? appliedVoucher.code : null,
      payment: false,
    });

    await newOrder.save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    const line_items = items.map((item) => ({
      price_data: {
        currency: "vnd",
        product_data: { name: item.name },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }));

    line_items.push({
      price_data: {
        currency: "vnd",
        product_data: { name: "Phí giao hàng" },
        unit_amount: 30000,
      },
      quantity: 1,
    });

    const sessionData = {
      line_items,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
      metadata: appliedVoucher
        ? {
            voucher: appliedVoucher.code,
            discount: `${appliedVoucher.discountPercent} VND`,
          }
        : {},
    };

    if (coupon) sessionData.discounts = [{ coupon: coupon.id }];

    const session = await stripe.checkout.sessions.create(sessionData);

    res.json({
      success: true,
      message: "Tạo session Stripe thành công",
      session_url: session.url,
      finalAmount,
      discountApplied: appliedVoucher?.discountPercent || 0,
    });
  } catch (error) {
    console.log("❌ Lỗi placeOrder:", error);
    res.json({ success: false, message: "Lỗi khi tạo đơn hàng" });
  }
};

const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;

  try {
    if (success === "true") {
      const order = await orderModel.findByIdAndUpdate(
        orderId,
        { payment: true },
        { new: true }
      );

      if (!order) {
        return res.json({
          success: false,
          message: "Không tìm thấy đơn hàng",
        });
      }

      const earnedPoints = Math.floor(order.amount / 10000);

      if (order.voucherCode) {
        const user = await userModel.findById(order.userId);

        if (user) {
          const index = user.redeemedVouchers.findIndex(
            (v) => v.code === order.voucherCode
          );

          if (index !== -1) user.redeemedVouchers.splice(index, 1);

          user.points += earnedPoints;

          await user.save();

          return res.json({
            success: true,
            message: "Thanh toán thành công, đã xóa 1 voucher và cộng điểm",
            earnedPoints,
            user: user.toObject({
              versionKey: false,
              transform: (_, ret) => {
                delete ret.password;
                return ret;
              },
            }),
          });
        }
      }

      const updatedUser = await userModel
        .findByIdAndUpdate(
          order.userId,
          { $inc: { points: earnedPoints } },
          { new: true }
        )
        .select("-password");

      return res.json({
        success: true,
        message: "Thanh toán thành công, cộng điểm thưởng",
        earnedPoints,
        user: updatedUser,
      });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      return res.json({
        success: false,
        message: "Thanh toán thất bại, đơn hàng bị xóa",
      });
    }
  } catch (error) {
    console.log("❌ Lỗi verifyOrder:", error);
    return res.json({
      success: false,
      message: "Lỗi khi xác minh thanh toán",
    });
  }
};

const userOrders = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const orders = await orderModel.find({ userId }).sort({ _id: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.log("❌ Lỗi userOrders:", error);
    res.json({
      success: false,
      message: "Lỗi không tìm thấy đơn hàng",
    });
  }
};

const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, orders });
  } catch (error) {
    console.log("❌ Lỗi listOrders:", error);
    res.json({ success: false, message: "Error fetching orders" });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const order = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order)
      return res.json({ success: false, message: "Không tìm thấy đơn hàng" });

    const notification = await notificationModel.create({
      userId: order.userId,
      message: `Đơn hàng #${order._id} đã chuyển sang trạng thái: ${status}`,
    });

    sendOrderStatusUpdate(order.userId.toString(), {
      id: notification._id,
      message: notification.message,
      read: notification.read,
      createdAt: notification.createdAt,
    });

    res.json({
      success: true,
      message: "Trạng thái đơn hàng đã được cập nhật",
    });
  } catch (error) {
    console.log("❌ Lỗi updateStatus:", error);
    res.json({ success: false, message: "Lỗi cập nhật trạng thái đơn hàng" });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };
