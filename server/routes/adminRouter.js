// server/routes/adminRouter.js
const express = require("express");
const User = require("../models/User");

const router = express.Router();

// ✅ 승인 대기중 유저 목록 조회
router.get("/pending", async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: "pending" }).select(
      "name email role status createdAt"
    );
    res.json(pendingUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "승인 목록 불러오기 오류" });
  }
});

// ✅ 계정 승인
router.put("/approve/:id", async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "승인 처리 오류" });
  }
});

// ✅ 계정 거절
router.put("/reject/:id", async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "거절 처리 오류" });
  }
});
// 권한 변경
router.put("/update-role/:id", async (req, res) => {
  try {
    const { role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    res.json({ success: true, updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: "권한 변경 중 오류 발생" });
  }
});

module.exports = router;
