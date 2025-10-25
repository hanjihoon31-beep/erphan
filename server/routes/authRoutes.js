// server/routes/authRouter.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// ✅ 회원가입 (승인 대기)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "이미 등록된 이메일입니다." });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      status: "pending",
    });

    res.status(201).json({ message: "관리자 승인 대기 중입니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 로그인 (승인된 계정만)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "존재하지 않는 계정입니다." });

    if (user.status === "pending")
      return res.status(403).json({ message: "관리자 승인 대기 중입니다." });

    if (user.status === "rejected")
      return res.status(403).json({ message: "승인이 거절된 계정입니다." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, role: user.role, name: user.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "로그인 중 오류 발생" });
  }
});

module.exports = router;
