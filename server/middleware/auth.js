// server/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// JWT 토큰 검증 미들웨어
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "인증 토큰이 필요합니다." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "유효하지 않은 계정입니다." });
    }

    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "토큰이 만료되었습니다." });
    }
    return res.status(500).json({ message: "인증 처리 중 오류가 발생했습니다." });
  }
};

// 권한 체크 미들웨어
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        message: "이 작업을 수행할 권한이 없습니다.",
        requiredRoles: allowedRoles,
        yourRole: req.userRole
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
