// server/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// JWT 토큰 검증 미들웨어
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ message: "인증 토큰이 필요합니다." });
    }

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 사용자 정보 조회 (비밀번호 제외)
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "유효하지 않은 사용자입니다." });
    }

    // 계정 상태 확인
    if (user.status !== "active") {
      return res.status(403).json({
        message: user.status === "inactive"
          ? "비활성화된 계정입니다."
          : "승인되지 않은 계정입니다."
      });
    }

    // req 객체에 사용자 정보 추가
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "토큰이 만료되었습니다." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    }
    console.error("인증 오류:", error);
    res.status(500).json({ message: "인증 처리 중 오류 발생" });
  }
};

// 관리자 권한 확인 미들웨어
const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "인증이 필요합니다." });
  }

  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({ message: "관리자 권한이 필요합니다." });
  }

  next();
};

// 최고관리자 권한 확인 미들웨어
const verifySuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "인증이 필요합니다." });
  }

  if (req.user.role !== "superadmin") {
    return res.status(403).json({ message: "최고관리자 권한이 필요합니다." });
  }

  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifySuperAdmin,
};
