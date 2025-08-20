import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const { token } = req.headers;
  if (!token) {
    return res.json({
      success: false,
      message: "Unauthorized access, token missing",
    });
  }
  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    if (!req.body) {
      req.body = {};
    }
    req.body.userId = token_decode.id;
    next();
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Unauthorized access, invalid token",
    });
  }
};

export default authMiddleware;
