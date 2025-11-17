import { Resend } from "resend";
import contactModel from "../models/contactModel.js";
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cần thiết.",
      });
    }

    // Lưu vào MongoDB
    const newContact = await contactModel.create({
      name,
      email,
      subject,
      message,
    });

    // Gửi mail tới admin qua Resend
    await resend.emails.send({
      // ✅ FROM: Dùng email no-reply của tên miền (phải được xác minh)
      from: `Tomato Contact <${process.env.DOMAIN_EMAIL_NOREPLY}>`,
      // ✅ TO: Gửi tới email cá nhân/Gmail của Admin
      to: process.env.EMAIL_USER,
      subject: `[Liên hệ mới] ${subject}`,
      html: `
        <h3>Khách hàng mới gửi liên hệ:</h3>
        <p><b>Tên:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Chủ đề:</b> ${subject}</p>
        <p><b>Nội dung:</b> ${message}</p>
        <hr />
        <p style="font-style:italic">Gửi tự động bởi hệ thống Tomato.</p>
      `,
    });
    return res.json({
      success: true,
      message: "Đã gửi liên hệ thành công!",
      data: newContact,
    });
  } catch (err) {
    console.error("Lỗi gửi liên hệ:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại.",
    });
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
    const { id } = req.params;
    const { replyMessage } = req.body;

    if (!replyMessage) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập nội dung phản hồi.",
      });
    }

    const contact = await contactModel.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy liên hệ.",
      });
    }

    // Gửi mail qua Resend
    await resend.emails.send({
      from: `Tomato Support <${process.env.DOMAIN_EMAIL_ADMIN}>`,
      to: contact.email,
      subject: `Phản hồi: ${contact.subject}`,
      html: `
        <p>Xin chào <b>${contact.name}</b>,</p>
        <p>Phản hồi từ Tomato:</p>
        <div style="background:#f3f3f3;padding:10px;border-radius:5px;">
          ${replyMessage}
        </div>
        <hr/>
        <p style="font-style:italic">Trân trọng, đội ngũ Tomato.</p>
      `,
    });

    // Cập nhật trạng thái
    contact.status = "replied";
    contact.replyMessage = replyMessage;
    await contact.save();

    return res.json({
      success: true,
      message: "Phản hồi đã được gửi!",
      data: contact,
    });
  } catch (err) {
    console.error("Lỗi khi phản hồi:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi gửi phản hồi.",
    });
  }
};
