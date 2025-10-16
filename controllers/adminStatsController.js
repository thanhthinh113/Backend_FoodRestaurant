import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Food from "../models/foodModel.js";

export const getAdminStats = async (req, res) => {
  try {
    // Tổng doanh thu
    const orders = await Order.find({ status: "Đã giao" });
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Đơn hàng theo trạng thái
    const orderCounts = {
      total: await Order.countDocuments(),
      pending: await Order.countDocuments({ status: "Đang xử lý" }),
      delivered: await Order.countDocuments({ status: "Đã giao" }),
      canceled: await Order.countDocuments({ status: "Đã hủy" }),
    };

    // Tổng người dùng
    const totalUsers = await User.countDocuments();

    // Món ăn bán chạy
    const foodStats = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.foodId",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.price" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "foods",
          localField: "_id",
          foreignField: "_id",
          as: "food",
        },
      },
      { $unwind: "$food" },
      {
        $project: {
          name: "$food.name",
          image: "$food.image",
          totalSold: 1,
          totalRevenue: 1,
        },
      },
    ]);

    // Doanh thu theo tháng
    const revenueByMonth = await Order.aggregate([
      { $match: { status: "Đã giao" } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue,
        orderCounts,
        totalUsers,
        foodStats,
        revenueByMonth,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi lấy thống kê" });
  }
};
