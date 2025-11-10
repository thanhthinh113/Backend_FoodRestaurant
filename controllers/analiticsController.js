import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js";
import categoryModel from "../models/categoryModel.js";
import voucherModel from "../models/voucherModel.js";
import contactModel from "../models/contactModel.js";

export const getSummary = async (req, res) => {
  try {
    // SỐ LIỆU CƠ BẢN ---
    const [
      totalUsers,
      totalOrders,
      totalFoods,
      totalCategories,
      totalVouchers,
      totalContacts,
    ] = await Promise.all([
      userModel.countDocuments(),
      orderModel.countDocuments(),
      foodModel.countDocuments(),
      categoryModel.countDocuments(),
      voucherModel.countDocuments(),
      contactModel.countDocuments(),
    ]);

    // DOANH THU ---
    const paidOrders = await orderModel.find({ payment: true });
    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + order.amount,
      0
    );

    // ĐƠN HÀNG THEO TRẠNG THÁI ---
    const statusCounts = await orderModel.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // TOP 5 MÓN BÁN CHẠY ---
    const topSellingFoods = await orderModel.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          name: "$_id",
          totalQuantity: 1,
        },
      },
    ]);

    // DOANH THU THEO THÁNG ---
    const monthlySales = await orderModel.aggregate([
      { $match: { payment: true } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalRevenue: { $sum: "$amount" },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    //  DOANH THU THEO DANH MỤC ---
    const categorySales = await orderModel.aggregate([
      { $match: { payment: true } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "foods",
          localField: "items.foodId",
          foreignField: "_id",
          as: "foodDetails",
        },
      },
      { $unwind: "$foodDetails" },
      {
        $group: {
          _id: "$foodDetails.categoryId",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.quantity", "$items.price"] },
          },
        },
      },
      { $sort: { totalRevenue: -1 } },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 0,
          categoryName: {
            $ifNull: ["$categoryDetails.name", "Không xác định"],
          },
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
    ]);

    // --- Thống kê voucher dựa theo order ---
    const usedVoucherCount = await orderModel.countDocuments({
      payment: true,
      voucherCode: { $ne: null },
    });

    // Tổng số voucher được tạo (để so sánh)
    const totalVoucherCount = await voucherModel.countDocuments();

    const voucherStats = {
      total: totalVoucherCount,
      used: usedVoucherCount,
    };

    res.json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          orders: totalOrders,
          foods: totalFoods,
          categories: totalCategories,
          vouchers: totalVouchers,
          contacts: totalContacts,
        },
        revenue: totalRevenue,
        orderStatus: statusCounts,
        topSellingFoods,
        monthlySales,
        categorySales,
        voucherStats,
      },
    });
  } catch (error) {
    console.error("❌ Lỗi thống kê:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi Server khi thống kê",
      error: error.message,
    });
  }
};
