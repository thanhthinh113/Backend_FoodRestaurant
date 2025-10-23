import Review from "../models/reviewModel.js";
import Food from "../models/foodModel.js";
import Order from "../models/orderModel.js"; // cần import để kiểm tra đã mua chưa

// ✅ Thêm đánh giá (chỉ khi user đã đăng nhập & từng mua hàng)
export const addReview = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const userName = req.user?.name || req.body.userName || "Người dùng";
    const { foodId, rating, comment } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Bạn cần đăng nhập để đánh giá." });
    }
    if (!foodId || !rating) {
      return res.status(400).json({ message: "Thiếu thông tin cần thiết." });
    }

   const hasPurchased = await Order.findOne({
  userId,
  "items.foodId": foodId,
  $or: [
    { status: { $in: ["Delivered", "Completed", "Food Processing"] } },
    { payment: true },
  ],
});


    if (!hasPurchased) {
      return res.status(403).json({
        message: "Bạn chỉ có thể đánh giá sản phẩm đã mua.",
      });
    }

    // ✅ Nếu đã từng đánh giá, cập nhật lại
    const existingReview = await Review.findOne({ userId, foodId });
    if (existingReview) {
      existingReview.rating = rating;
      existingReview.comment = comment;
      existingReview.updatedAt = new Date();
      await existingReview.save();
    } else {
      // ✅ Tạo mới đánh giá
      const review = new Review({
        foodId,
        userId,
        userName,
        rating,
        comment,
        createdAt: new Date(),
      });
      await review.save();
    }

    // ✅ Cập nhật lại điểm trung bình cho món ăn
    const reviews = await Review.find({ foodId });
    const avg =
      reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);
    await Food.findByIdAndUpdate(foodId, { averageRating: avg.toFixed(1) });

    res.status(201).json({
      message: "Đánh giá thành công!",
      averageRating: avg.toFixed(1),
      totalReviews: reviews.length,
    });
  } catch (err) {
    console.error("❌ Lỗi khi thêm đánh giá:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// ✅ Lấy danh sách đánh giá theo món ăn
export const getReviewsByFood = async (req, res) => {
  try {
    const { foodId } = req.params;
    const reviews = await Review.find({ foodId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách đánh giá:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// ✅ API kiểm tra xem user có được phép đánh giá không
export const canReview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { foodId } = req.params;

    if (!userId) return res.json({ canReview: false });

    const hasPurchased = await Order.findOne({
      userId,
      "items.foodId": foodId,
      status: { $in: ["Delivered", "Completed", "Food Processing"] },
    });

    res.json({ canReview: !!hasPurchased });
  } catch (err) {
    console.error("❌ Lỗi kiểm tra quyền đánh giá:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
