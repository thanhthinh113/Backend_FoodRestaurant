import nodemailer from "nodemailer";
import contactModel from "../models/contactModel.js";

// 1. 🛑 TỐI ƯU HÓA: KHỞI TẠO TRANSPORTER MỘT LẦN KHI SERVER KHỞI ĐỘNG
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Host được chỉ định rõ ràng
  port: 465, // Port SSL
  secure: true, // Bắt buộc cho port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // PHẢI LÀ MẬT KHẨU ỨNG DỤNG
  },
});

// 1. Gửi Form Liên Hệ (Đã tối ưu tốc độ)
export const sendContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu thông tin cần thiết." });
    }

    // 🧾 Lưu vào MongoDB (Vẫn chờ hoàn tất)
    const newContact = await contactModel.create({
      name,
      email,
      subject,
      message,
    });

    // 2. ⚡ Gửi email bất đồng bộ (BỎ 'await')
    transporter
      .sendMail({
        from: `"Liên hệ Tomato" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, // Gửi cho Admin
        subject: `[Liên hệ] ${subject}`,
        html: `
        <h3>Khách hàng mới gửi liên hệ:</h3>
        <p><b>Tên:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Chủ đề:</b> ${subject}</p>
        <p><b>Nội dung:</b></p>
        <p>${message}</p>
        <hr/>
        <p><i>Được gửi tự động từ hệ thống Tomato.</i></p>
      `,
      })
      .catch((err) => console.error("❌ Lỗi khi gửi liên hệ (Admin):", err)); // Xử lý lỗi mail riêng

    // ✅ Phản hồi thành công NGAY LẬP TỨC sau khi lưu DB
    return res.json({
      success: true,
      message: "Đã gửi liên hệ thành công. Cảm ơn bạn đã góp ý!",
      data: newContact,
    });
  } catch (err) {
    console.error("❌ Lỗi khi xử lý sendContactForm:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi máy chủ, vui lòng thử lại." });
  }
};

// 2. Lấy danh sách Contact (Thiếu trong code bạn gửi, bổ sung)
export const getAllContacts = async (req, res) => {
  try {
    const contacts = await contactModel.find().sort({ createdAt: -1 });
    res.json({ success: true, data: contacts });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi lấy danh sách liên hệ." });
  }
};

// 3. Cập nhật trạng thái (Thiếu trong code bạn gửi, bổ sung)
export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const contact = await contactModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!contact)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tin nhắn." });

    res.json({ success: true, data: contact });
  } catch (err) {
    console.error("Lỗi cập nhật trạng thái:", err);
    res
      .status(500)
      .json({ success: false, message: "Không thể cập nhật trạng thái." });
  }
};

// 4. Admin phản hồi lại email người dùng (Đã tối ưu tốc độ)
export const replyContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyMessage } = req.body;

    if (!replyMessage)
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập nội dung phản hồi." });

    const contact = await contactModel.findById(id);
    if (!contact)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy liên hệ." });

    // 2. ⚡ Gửi email bất đồng bộ (BỎ 'await')
    transporter
      .sendMail({
        from: `"Phản hồi từ Tomato 🍅" <${process.env.EMAIL_USER}>`,
        to: contact.email,
        subject: `Phản hồi: ${contact.subject}`,
        html: `
        <p>Xin chào <b>${contact.name}</b>,</p>
        <p>Phản hồi từ bộ phận hỗ trợ Tomato:</p>
        <div style="background:#f8f8f8;padding:10px;border-radius:8px;">
          ${replyMessage}
        </div>
        <hr/>
        <p><i>Trân trọng,<br/>Đội ngũ Tomato.</i></p>
      `,
      })
      .catch((err) => console.error("❌ Lỗi khi gửi phản hồi (User):", err)); // Xử lý lỗi mail riêng

    // 🗃️ Cập nhật trạng thái (Vẫn chờ hoàn tất)
    contact.status = "replied";
    contact.replyMessage = replyMessage;
    await contact.save();

    // ✅ Phản hồi thành công NGAY LẬP TỨC
    return res.json({
      success: true,
      message: "Đã gửi phản hồi thành công!",
      data: contact,
    });
  } catch (err) {
    console.error("❌ Lỗi khi xử lý replyContact:", err);
    res.status(500).json({ success: false, message: "Lỗi khi gửi phản hồi." });
  }
};
