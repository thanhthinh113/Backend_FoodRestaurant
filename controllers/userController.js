import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

import pendingUserModel from "../models/pendingUserModel.js";

import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const sendOTPEmail = async (toEmail, name, otpCode, subject) => {
  try {
    await resend.emails.send({
      // Dùng địa chỉ email chuyên nghiệp đã xác minh trên Resend
      from: `Tomato Support 🍅 <${process.env.DOMAIN_EMAIL_NOREPLY}>`,
      to: [toEmail],
      subject: subject,
      html: `
        <h3>Xin chào ${name || "bạn"},</h3>
        <p>Mã xác thực của bạn là:</p>
        <h2 style="color:#2c7be5;">${otpCode}</h2>
        <p>Mã có hiệu lực trong 10 phút.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error("Lỗi khi gửi email Resend:", error);
    return false;
  }
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // 1. Kiểm tra dữ liệu (Giữ nguyên)
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({
        success: false,
        message: "Tài khoản đã tồn tại, vui lòng đăng nhập.",
      });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Email không hợp lệ." });
    }
    if (password.length < 8) {
      return res.json({ success: false, message: "Mật khẩu ít nhất 8 ký tự." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Xử lý Pending User (Giữ nguyên)
    let pendingUser = await pendingUserModel.findOne({ email });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    if (pendingUser) {
      if (pendingUser.otpExpires > new Date()) {
        pendingUser.name = name;
        pendingUser.password = hashedPassword;
        await pendingUser.save();

        // ✅ Gửi lại OTP qua Resend (Sử dụng hàm mới)
        const emailSent = await sendOTPEmail(
          email,
          pendingUser.name,
          pendingUser.otpCode,
          "Mã xác thực tài khoản"
        );

        if (emailSent) {
          return res.json({
            success: true,
            message:
              "OTP vẫn còn hiệu lực, đã gửi lại mã và cập nhật thông tin mới.",
          });
        }
        throw new Error("Gửi OTP thất bại.");
      }

      await pendingUserModel.deleteOne({ email });
    }

    // 3. Tạo pending mới và gửi OTP mới
    pendingUser = new pendingUserModel({
      name,
      email,
      password: hashedPassword,
      otpCode,
      otpExpires,
    });
    await pendingUser.save();

    // ✅ Gửi OTP mới qua Resend (Sử dụng hàm mới)
    const emailSent = await sendOTPEmail(
      email,
      name,
      otpCode,
      "Mã xác thực tài khoản"
    );

    if (emailSent) {
      res.json({ success: true, message: "Đã gửi mã OTP đến email." });
    } else {
      // Xóa user pending nếu gửi mail thất bại
      await pendingUserModel.deleteOne({ email });
      res.json({
        success: false,
        message: "Đăng ký thất bại: Không gửi được mã OTP.",
      });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Đăng ký thất bại." });
  }
};

const verifyEmail = async (req, res) => {
  const { email, otpCode } = req.body;
  // ... (Hàm này giữ nguyên vì không gửi email) ...
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

    const user = new userModel({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      isVerified: true,
    });
    await user.save();

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
    await user.save();

    // ✅ Gửi OTP Đặt lại mật khẩu qua Resend (Sử dụng hàm mới)
    const emailSent = await sendOTPEmail(
      email,
      user.name,
      otpCode,
      "Đặt lại mật khẩu tài khoản"
    );

    if (emailSent) {
      res.json({
        success: true,
        message: "Đã gửi mã xác thực đặt lại mật khẩu đến email.",
      });
    } else {
      // Nếu gửi mail thất bại, reset lại OTP trong DB
      user.resetOtp = null;
      user.resetOtpExpires = null;
      await user.save();
      res.json({ success: false, message: "Gửi mã OTP thất bại." });
    }
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
