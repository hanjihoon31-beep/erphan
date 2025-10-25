// server/routes/authRoutes.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { validateRegistration, validateLogin } = require("../middleware/validation");

const router = express.Router();

// ✅ 회원가입 (승인 대기) - 입력 검증 추가
router.post("/register", validateRegistration, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 이메일 중복 체크
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "이미 등록된 이메일입니다." });
    }

    // 비밀번호 해싱 (salt rounds 증가)
    const hashedPassword = await bcrypt.hash(password, 12);

    // 사용자 생성 (role은 middleware에서 검증됨)
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "employee", // 기본값 employee
      status: "pending",
    });

    res.status(201).json({
      message: "회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다."
    });
  } catch (error) {
    // 에러 로깅 (프로덕션에서는 로깅 서비스 사용)
    console.error("Registration error:", error.message);

    // 상세한 에러 정보 노출 방지
    res.status(500).json({ message: "회원가입 처리 중 오류가 발생했습니다." });
  }
});

// ✅ 로그인 (승인된 계정만) - 입력 검증 추가
router.post("/login", validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // 사용자 조회 (비밀번호 제외하지 않음 - 비교 필요)
    const user = await User.findOne({ email });

    // 보안을 위해 동일한 메시지 사용 (계정 존재 여부 노출 방지)
    if (!user) {
      return res.status(401).json({ message: "이메일 또는 비밀번호가 일치하지 않습니다." });
    }

    // 계정 상태 체크
    if (user.status === "pending") {
      return res.status(403).json({ message: "관리자 승인 대기 중입니다." });
    }

    if (user.status === "rejected") {
      return res.status(403).json({ message: "승인이 거절된 계정입니다." });
    }

    // 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "이메일 또는 비밀번호가 일치하지 않습니다." });
    }

    // JWT 토큰 생성 (24시간 유효)
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // 로그인 성공 응답
    res.json({
      token,
      role: user.role,
      name: user.name,
      userId: user._id
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "로그인 처리 중 오류가 발생했습니다." });
  }
});

module.exports = router;
