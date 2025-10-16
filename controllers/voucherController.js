import voucherModel from "../models/voucherModel.js";
import userModel from "../models/userModel.js";

// 🧾 Admin (hoặc public) tạo voucher
export const createVoucher = async (req, res) => {
  try {
    const { code, discountPercent, pointsRequired, expiryDate } = req.body;
    const exists = await voucherModel.findOne({ code });
    if (exists)
      return res.json({
        success: false,
        message: "Voucher code already exists",
      });

    const voucher = new voucherModel({
      code,
      discountPercent,
      pointsRequired,
      expiryDate,
    });
    await voucher.save();
    res.json({ success: true, voucher });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Failed to create voucher" });
  }
};

// 📋 Xem tất cả voucher (tự động kiểm tra hết hạn)
export const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await voucherModel.find();
    const now = new Date();

    // ✅ Cập nhật trạng thái theo ngày hết hạn
    const updatedVouchers = await Promise.all(
      vouchers.map(async (v) => {
        if (new Date(v.expiryDate) < now && v.isActive) {
          v.isActive = false;
          await v.save();
        }
        return v;
      })
    );

    res.json({ success: true, vouchers: updatedVouchers });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Failed to get vouchers" });
  }
};

// ❌ Xóa voucher
export const deleteVoucher = async (req, res) => {
  try {
    await voucherModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Voucher deleted" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Failed to delete voucher" });
  }
};

// 🔄 Người dùng đổi điểm lấy voucher
export const redeemVoucher = async (req, res) => {
  try {
    const { userId, code } = req.body;
    const voucher = await voucherModel.findOne({ code, isActive: true });
    if (!voucher)
      return res.json({
        success: false,
        message: "Voucher not found or inactive",
      });

    // Kiểm tra hết hạn
    if (new Date(voucher.expiryDate) < new Date()) {
      voucher.isActive = false;
      await voucher.save();
      return res.json({
        success: false,
        message: "Voucher expired",
      });
    }

    const user = await userModel.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found" });

    if (user.points < voucher.pointsRequired) {
      return res.json({ success: false, message: "Not enough points" });
    }

    // Trừ điểm và thêm voucher vào danh sách đã đổi
    user.points -= voucher.pointsRequired;
    if (!user.redeemedVouchers) user.redeemedVouchers = [];
    user.redeemedVouchers.push({
      code: voucher.code,
      discountPercent: voucher.discountPercent,
      expiryDate: voucher.expiryDate,
    });
    await user.save();

    res.json({
      success: true,
      message: "Voucher redeemed successfully",
      voucher,
      userPoints: user.points,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Failed to redeem voucher" });
  }
};
