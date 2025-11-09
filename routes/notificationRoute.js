import express from "express";
import authMiddleware from "../middleware/auth.js";
import Notification from "../models/notificationModel.js";

const router = express.Router();

// Lấy notifications của user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort(
      { createdAt: -1 }
    );
    res.json({ success: true, notifications });
  } catch (err) {
    res.json({ success: false, message: "Error fetching notifications" });
  }
});

// Mark read
router.post("/mark-read", authMiddleware, async (req, res) => {
  const { id } = req.body;
  try {
    await Notification.findByIdAndUpdate(id, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: "Error marking notification read" });
  }
});

export default router;
