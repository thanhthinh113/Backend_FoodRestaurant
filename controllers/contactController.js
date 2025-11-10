import nodemailer from "nodemailer";
import contactModel from "../models/contactModel.js";

export const sendContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu thông tin cần thiết." });
    }

    // 🧾 Lưu vào MongoDB
    const newContact = await contactModel.create({
      name,
      email,
      subject,
      message,
    });

    // 📧 Gửi email cho admin (tùy chọn)
    const transporter = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Liên hệ Tomato" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
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
    });

    return res.json({
      success: true,
      message: "Đã gửi liên hệ thành công. Cảm ơn bạn đã góp ý!",
      data: newContact,
    });
  } catch (err) {
    console.error("Lỗi khi gửi liên hệ:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi máy chủ, vui lòng thử lại." });
  }
};

// (Tuỳ chọn) Admin có thể lấy danh sách contact
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

// ✅ Cập nhật trạng thái (ví dụ: new → viewed)
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

// ✉️ Admin phản hồi lại email người dùng
export const replyContact = async (req, res) => {
  try {
    const { id } = req.params; // id tin nhắn
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

    // 📧 Gửi email phản hồi
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
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
    });

    // 🗃️ Cập nhật trạng thái
    contact.status = "replied";
    contact.replyMessage = replyMessage;
    await contact.save();

    return res.json({
      success: true,
      message: "Đã gửi phản hồi thành công!",
      data: contact,
    });
  } catch (err) {
    console.error("Lỗi khi phản hồi:", err);
    res.status(500).json({ success: false, message: "Lỗi khi gửi phản hồi." });
  }
};
