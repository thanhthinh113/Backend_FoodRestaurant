import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import nodemailer from "nodemailer";
import crypto from "crypto";
import pendingUserModel from "../models/pendingUserModel.js";
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};
const transporter = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY, // ⬅️ Dùng API Key mới
    },
  })
);

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // ... logic kiểm tra hợp lệ ...

    // Hash pass
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kiểm tra email trong pendingUser
    let pendingUser = await pendingUserModel.findOne({ email });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    if (pendingUser) {
      // Nếu còn hiệu lực
      if (pendingUser.otpExpires > new Date()) {
        // Cập nhật lại thông tin mới
        pendingUser.name = name;
        pendingUser.password = hashedPassword;
        await pendingUser.save(); // 🛑 CHỈ CHỜ LƯU DB

        // ⚡ Gửi lại OTP (BỎ 'await')
        transporter
          .sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Mã xác thực tài khoản",
            html: `
        <h3>Xin chào ${pendingUser.name},</h3>
        <p>Mã OTP của bạn là:</p>
        <h2 style="color:#2c7be5;">${pendingUser.otpCode}</h2>
        <p>Hiệu lực đến ${pendingUser.otpExpires.toLocaleTimeString()}.</p>
      `,
          })
          .catch((err) => console.error("❌ Lỗi gửi lại OTP:", err)); // Xử lý lỗi riêng

        // ✅ Phản hồi thành công ngay lập tức
        return res.json({
          success: true,
          message:
            "OTP vẫn còn hiệu lực, đã gửi lại mã và cập nhật thông tin mới.",
        });
      }

      // Nếu hết hạn → xóa pending cũ
      await pendingUserModel.deleteOne({ email });
    }

    // Tạo pending mới
    pendingUser = new pendingUserModel({
      name,
      email,
      password: hashedPassword,
      otpCode,
      otpExpires,
    });
    await pendingUser.save(); // 🛑 CHỈ CHỜ LƯU DB

    // ⚡ Gửi OTP mới (BỎ 'await')
    transporter
      .sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Mã xác thực tài khoản",
        html: `
        <h3>Xin chào ${name},</h3>
        <p>Mã OTP của bạn là:</p>
        <h2 style="color:#2c7be5;">${otpCode}</h2>
        <p>Hiệu lực trong 10 phút.</p>
      `,
      })
      .catch((err) => console.error("❌ Lỗi gửi OTP đăng ký:", err)); // Xử lý lỗi riêng

    // ✅ Phản hồi thành công ngay lập tức
    res.json({ success: true, message: "Đã gửi mã OTP đến email." });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Đăng ký thất bại." });
  }
};

const verifyEmail = async (req, res) => {
  const { email, otpCode } = req.body;
  try {
    const pendingUser = await pendingUserModel.findOne({ email });
    if (!pendingUser) {
      return res.json({
        success: false,
        message: "Không tìm thấy yêu cầu xác thực.",
      });
    }

    if (pendingUser.otpCode !== otpCode) {
      return res.json({ success: false, message: "Mã OTP không đúng." });
    }
    if (pendingUser.otpExpires < new Date()) {
      return res.json({ success: false, message: "Mã OTP đã hết hạn." });
    }

    // Di chuyển từ pending sang user chính thức
    const user = new userModel({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      isVerified: true,
    });
    await user.save();

    // Xóa pending user
    await pendingUserModel.deleteOne({ email });

    res.json({
      success: true,
      message: "Xác thực thành công, bạn có thể đăng nhập.",
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Lỗi khi xác thực OTP." });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user)
      return res.json({ success: false, message: "Tài khoản không tồn tại" });

    if (!user.isVerified)
      return res.json({ success: false, message: "Tài khoản chưa xác thực" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: "Sai mật khẩu" });

    const token = createToken(user._id);
    res.json({
      success: true,
      message: "Đăng nhập thành công",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        points: user.points,
        redeemedVouchers: user.redeemedVouchers || [],
      },
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Lỗi đăng nhập" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({}, "-password");
    res.json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: "Lấy danh sách người dùng thất bại",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const updatedUser = await userModel.findByIdAndUpdate(
      req.body.userId,
      { name, phone, address },
      { new: true, select: "-password" }
    );

    if (!updatedUser) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    res.json({
      success: true,
      message: "Cập nhật thông tin cá nhân thành công",
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: "Cập nhật thông tin cá nhân thất bại",
    });
  }
};

const getUserPoints = async (req, res) => {
  try {
    const user = await userModel.findById(req.body.userId).select("points");
    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }
    res.json({ success: true, points: user.points });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Lấy điểm thưởng thất bại" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.body.userId).select("-password");
    if (!user)
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Lấy thông tin người dùng thất bại" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.json({
        success: false,
        message: "Vui lòng nhập đủ thông tin",
      });
    }

    if (newPassword.length < 8) {
      return res.json({
        success: false,
        message: "Mật khẩu mới phải ít nhất 8 ký tự",
      });
    }

    if (currentPassword === newPassword) {
      return res.json({
        success: false,
        message: "Mật khẩu mới không được trùng với mật khẩu cũ",
      });
    }

    const user = await userModel.findById(req.body.userId);
    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.json({
        success: false,
        message: "Mật khẩu hiện tại không đúng",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Đổi mật khẩu thất bại" });
  }
};
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ success: false, message: "Email chưa được đăng ký." });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    user.resetOtp = otpCode;
    user.resetOtpExpires = otpExpires;
    await user.save(); // 🛑 CHỈ CHỜ LƯU DB

    // ⚡ Gửi OTP đặt lại mật khẩu (BỎ 'await')
    transporter
      .sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Đặt lại mật khẩu tài khoản",
        html: `
        <h3>Xin chào ${user.name || "bạn"},</h3>
        <p>Mã xác thực đặt lại mật khẩu của bạn là:</p>
        <h2 style="color:#2c7be5;">${otpCode}</h2>
        <p>Hiệu lực trong 10 phút.</p>
      `,
      })
      .catch((err) => console.error("❌ Lỗi gửi OTP quên mật khẩu:", err)); // Xử lý lỗi riêng

    // ✅ Phản hồi thành công ngay lập tức
    res.json({
      success: true,
      message: "Đã gửi mã xác thực đặt lại mật khẩu đến email.",
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Gửi mã OTP thất bại." });
  }
};

const resetPassword = async (req, res) => {
  const { email, otpCode, newPassword } = req.body;
  try {
    const user = await userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy tài khoản." });
    }

    if (
      !user.resetOtp ||
      user.resetOtp !== otpCode.toString() ||
      user.resetOtpExpires < new Date()
    ) {
      return res.json({
        success: false,
        message: "Mã OTP không hợp lệ hoặc đã hết hạn.",
      });
    }

    if (newPassword.length < 8) {
      return res.json({
        success: false,
        message: "Mật khẩu mới phải ít nhất 8 ký tự.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Xóa OTP
    user.resetOtp = null;
    user.resetOtpExpires = null;

    await user.save();

    res.json({ success: true, message: "Đặt lại mật khẩu thành công." });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Lỗi khi đặt lại mật khẩu." });
  }
};

export {
  loginUser,
  registerUser,
  verifyEmail,
  getAllUsers,
  updateProfile,
  getUserPoints,
  getUserProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
