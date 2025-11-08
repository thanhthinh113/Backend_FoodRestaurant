import { generateUploadURL } from "../config/s3.js";

/**
 * [GET] /api/upload-url
 * FE truyền query: ?fileName=abc.jpg&fileType=image/jpeg
 * => Trả về pre-signed URL để FE upload ảnh lên S3
 */
export const getUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType } = req.query;

    if (!fileName || !fileType) {
      return res.status(400).json({ message: "Thiếu fileName hoặc fileType" });
    }

    const uploadUrl = await generateUploadURL(fileName, fileType);

    res.json({ uploadUrl });
  } catch (error) {
    console.error("❌ Lỗi khi tạo pre-signed URL:", error);
    res.status(500).json({ message: "Lỗi server khi tạo URL upload" });
  }
};
