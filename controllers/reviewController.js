import Review from "../models/reviewModel.js";
import Food from "../models/foodModel.js";

// ✅ Thêm đánh giá
export const addReview = async (req, res) => {
  try {
    const { foodId, userId, userName, rating, comment } = req.body;

    if (!foodId || !userId || !rating) {
      return res.status(400).json({ message: "Thiếu thông tin cần thiết." });
    }

    const review = new Review({
      foodId,
      userId,
      userName,
      rating,
      comment,
      createdAt: new Date(),
    });

    await review.save();

    // Cập nhật điểm trung bình của món ăn (tùy chọn)
    const reviews = await Review.find({ foodId });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Food.findByIdAndUpdate(foodId, { averageRating: avg.toFixed(1) });

    res.status(201).json({ message: "Đã thêm đánh giá thành công", review });
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
