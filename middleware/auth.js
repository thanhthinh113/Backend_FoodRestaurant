// import jwt from "jsonwebtoken";

// const authMiddleware = (req, res, next) => {
//   const { token } = req.headers;
//   if (!token) {
//     return res.json({
//       success: false,
//       message: "Unauthorized access, token missing",
//     });
//   }
//   try {
//     const token_decode = jwt.verify(token, process.env.JWT_SECRET);
//     if (!req.body) {
//       req.body = {};
//     }
//     req.body.userId = token_decode.id;
//     next();
//   } catch (error) {
//     console.log(error);
//     return res.json({
//       success: false,
//       message: "Unauthorized access, invalid token",
//     });
//   }
// };

// export default authMiddleware;
import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.token;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access, token missing",
      });
    }

    // Hỗ trợ cả dạng "Bearer <token>" hoặc token thô
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Gắn user info vào request để các controller sử dụng
    req.user = decoded;
    if (!req.body) req.body = {};
    req.body.userId = decoded.id;

    next();
  } catch (error) {
    console.error("❌ Auth error:", error.message);
    return res.status(403).json({
      success: false,
      message: "Unauthorized access, invalid token",
    });
  }
};

export default authMiddleware;
