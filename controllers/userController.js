import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

//login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Tìm người dùng theo email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({
        success: false,
        message: "Sai tài khoản",
      });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({
        success: false,
        message: "Sai mật khẩu",
      });
    }

    // Tạo token đăng nhập
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
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: "Đăng nhập thất bại, vui lòng thử lại sau",
    });
  }
};

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

//register user
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Kiểm tra email đã tồn tại
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({
        success: false,
        message: "Email này đã được đăng ký",
      });
    }

    // Kiểm tra định dạng email và độ dài mật khẩu
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Định dạng email không hợp lệ",
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Mật khẩu phải có ít nhất 8 ký tự",
      });
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      role: "user",
      points: 0,
      redeemedVouchers: [],
    });

    const user = await newUser.save();
    const token = createToken(user._id);

    res.json({
      success: true,
      message: "Đăng ký tài khoản thành công",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        redeemedVouchers: user.redeemedVouchers || [],
      },
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Đăng ký thất bại, vui lòng thử lại sau",
    });
  }
};

// get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({}, "-password"); // bỏ password ra cho an toàn
    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.log(error);
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
      req.body.userId, // đã có từ authMiddleware
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

    // Kiểm tra dữ liệu đầu vào
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

    // Kiểm tra trùng nhau
    if (currentPassword === newPassword) {
      return res.json({
        success: false,
        message: "Mật khẩu mới không được trùng với mật khẩu cũ",
      });
    }

    // Tìm user theo userId từ middleware
    const user = await userModel.findById(req.body.userId);
    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // So sánh mật khẩu cũ
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.json({
        success: false,
        message: "Mật khẩu hiện tại không đúng",
      });
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: "Đổi mật khẩu thất bại",
    });
  }
};

export {
  loginUser,
  registerUser,
  getAllUsers,
  updateProfile,
  getUserPoints,
  getUserProfile,
  changePassword,
};
