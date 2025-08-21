import userModel from "../models/userModel.js";
const adminAuth = async (req, res, next) => {
  try {
    const userData = await userModel.findById(req.body.userId);
    if (userData && userData.role === "admin") {
      next(); // Cho phép truy cập nếu là admin
    } else {
      res.json({
        success: false,
        message: "Access denied. You are not an admin.",
      });
    }
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export default adminAuth;
