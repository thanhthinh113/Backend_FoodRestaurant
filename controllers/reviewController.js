import Review from "../models/reviewModel.js";
import Food from "../models/foodModel.js";
import Order from "../models/orderModel.js";
import { generateUploadURL } from "../config/s3.js";
import { v4 as uuidv4 } from "uuid";

export const getPresignedUrl = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType)
      return res.status(400).json({ message: "Thiếu thông tin file." });

    const uniqueName = `${uuidv4()}-${fileName}`;
    const uploadUrl = await generateUploadURL(uniqueName, fileType);
    const fileUrl = `https://iamge-food.s3.us-east-1.amazonaws.com/${uniqueName}`;

    res.json({ uploadUrl, fileUrl });
  } catch (err) {
    console.error("Error generating presigned URL:", err);
    res.status(500).json({ message: "Lỗi tạo presigned URL" });
  }
};

export const addReview = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const userName = req.user?.name || req.body.userName || "Người dùng";
    const { foodId, rating, comment, orderId, media } = req.body;

    if (!userId) return res.status(401).json({ message: "Bạn cần đăng nhập." });
    if (!foodId || !rating || !orderId)
      return res.status(400).json({ message: "Thiếu thông tin." });

    const order = await Order.findOne({
      _id: orderId,
      userId,
      "items.foodId": foodId,
      status: { $in: ["Delivered", "Completed", "Food Processing"] },
    });

    if (!order)
      return res
        .status(403)
        .json({ message: "Bạn chỉ được đánh giá sản phẩm đã mua." });

    const existingReview = await Review.findOne({ userId, foodId, orderId });
    if (existingReview)
      return res
        .status(403)
        .json({ message: "Bạn đã đánh giá món ăn này trong đơn hàng này." });

    const review = new Review({
      foodId,
      userId,
      userName,
      orderId,
      rating,
      comment,
      media: media || null,
    });
    await review.save();

    const reviews = await Review.find({ foodId });
    const avg =
      reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);

    await Food.findByIdAndUpdate(foodId, { averageRating: avg.toFixed(1) });

    res.status(201).json({
      message: "Đánh giá thành công!",
      averageRating: avg.toFixed(1),
      totalReviews: reviews.length,
      review,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const getReviewsByFood = async (req, res) => {
  try {
    const { foodId } = req.params;
    const reviews = await Review.find({ foodId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const canReview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { foodId } = req.params;
    if (!userId) return res.json({ canReview: false, orders: [] });

    const orders = await Order.find({
      userId,
      "items.foodId": foodId,
      status: { $in: ["Delivered", "Completed", "Food Processing"] },
    });

    const pendingOrders = [];
    for (let order of orders) {
      const existing = await Review.findOne({
        userId,
        foodId,
        orderId: order._id,
      });
      if (!existing) pendingOrders.push(order);
    }

    res.json({ canReview: pendingOrders.length > 0, orders: pendingOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
export const adminReply = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { text } = req.body;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        reply: {
          text,
          adminName: req.user.name,
          adminId: req.user._id,
        },
      },
      { new: true }
    );

    res.json(review);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Lỗi gửi phản hồi" });
  }
};

export const adminReaction = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reaction } = req.body;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { reaction },
      { new: true }
    );

    res.json(review);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Lỗi cập nhật reaction" });
  }
};
