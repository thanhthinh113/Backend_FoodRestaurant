import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import e from "express";

//login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({
        success: false,
        message: "Invalid credentials",
      });
    }
    const token = createToken(user._id);
    res.json({
      success: true,
      message: "User logged in successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        points: user.points,
      },
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Failed to login user",
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
    // checking for valid email
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({
        success: false,
        message: "User already exists",
      });
    }
    //validating email format & strong password
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Invalid email format",
      });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name: name,
      email: email,
      password: hashedPassword,
      role: "user",
      points: 0,
    });
    const user = await newUser.save();
    const token = createToken(user._id);
    res.json({
      success: true,
      message: "User registered successfully",
      token,
      role: user.role,
      name: user.name,
      email: user.email,
      points: user.points,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Failed to register user",
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
      message: "Failed to fetch users",
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
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Failed to update profile" });
  }
};
const getUserPoints = async (req, res) => {
  try {
    const user = await userModel.findById(req.body.userId).select("points");
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, points: user.points });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Failed to fetch points" });
  }
};

export { loginUser, registerUser, getAllUsers, updateProfile, getUserPoints };
