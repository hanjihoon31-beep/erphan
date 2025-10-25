// server/routes/authRouter.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");

const router = express.Router();

// ✅ 이메일 전송 설정 (nodemailer)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ 회원가입 (사번, 이메일, 비밀번호, 이름)
router.post("/register", async (req, res) => {
  try {
    const { employeeId, name, email, password } = req.body;

    // 필수 입력값 체크
    if (!employeeId || !name || !email || !password) {
      return res.status(400).json({ message: "모든 필드를 입력해주세요." });
    }

    // 사번 중복 체크
    const existingEmployee = await User.findOne({ employeeId });
    if (existingEmployee) {
      return res.status(400).json({ message: "이미 등록된 사번입니다." });
    }

    // 이메일 중복 체크
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "이미 등록된 이메일입니다." });
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성 (최초 가입시 근무자로 설정)
    await User.create({
      employeeId,
      name,
      email,
      password: hashedPassword,
      role: "employee",
      status: "pending",
    });

    res.status(201).json({ message: "회원가입이 완료되었습니다. 관리자 승인 대기 중입니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 로그인 (사번으로 로그인)
router.post("/login", async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({ message: "사번과 비밀번호를 입력해주세요." });
    }

    const user = await User.findOne({ employeeId });
    if (!user) {
      return res.status(400).json({ message: "존재하지 않는 계정입니다." });
    }

    if (user.status === "pending") {
      return res.status(403).json({ message: "관리자 승인 대기 중입니다." });
    }

    if (user.status === "rejected") {
      return res.status(403).json({ message: "승인이 거절된 계정입니다." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        employeeId: user.employeeId,
        role: user.role,
        permissions: user.permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      role: user.role,
      name: user.name,
      employeeId: user.employeeId,
      permissions: user.permissions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "로그인 중 오류 발생" });
  }
});

// ✅ 비밀번호 찾기 - 인증코드 발송
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "이메일을 입력해주세요." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "등록되지 않은 이메일입니다." });
    }

    // 6자리 랜덤 인증코드 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 인증코드 저장 (30분 유효)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await PasswordReset.create({ email, code, expiresAt });

    // 이메일 발송
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "ERP 시스템 비밀번호 재설정 인증코드",
      html: `
        <h2>비밀번호 재설정 인증코드</h2>
        <p>안녕하세요, ${user.name}님</p>
        <p>비밀번호 재설정을 위한 인증코드는 다음과 같습니다:</p>
        <h1 style="color: #4CAF50; font-size: 32px;">${code}</h1>
        <p>이 인증코드는 30분간 유효합니다.</p>
        <p>본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "인증코드가 이메일로 발송되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "인증코드 발송 중 오류 발생" });
  }
});

// ✅ 비밀번호 재설정
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "모든 필드를 입력해주세요." });
    }

    // 인증코드 확인
    const resetRecord = await PasswordReset.findOne({ email, code });
    if (!resetRecord) {
      return res.status(400).json({ message: "잘못된 인증코드입니다." });
    }

    // 인증코드 만료 확인
    if (new Date() > resetRecord.expiresAt) {
      await PasswordReset.deleteOne({ _id: resetRecord._id });
      return res.status(400).json({ message: "인증코드가 만료되었습니다." });
    }

    // 비밀번호 업데이트
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    // 사용된 인증코드 삭제
    await PasswordReset.deleteOne({ _id: resetRecord._id });

    res.json({ message: "비밀번호가 성공적으로 재설정되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "비밀번호 재설정 중 오류 발생" });
  }
});

module.exports = router;
