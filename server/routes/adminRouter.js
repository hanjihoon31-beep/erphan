// server/routes/adminRouter.js
const express = require("express");
const User = require("../models/User");

const router = express.Router();

// ✅ 모든 사용자 목록 조회
router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("employeeId name email role status permissions createdAt")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "사용자 목록 불러오기 오류" });
  }
});

// ✅ 승인 대기중 유저 목록 조회
router.get("/pending", async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: "pending" }).select(
      "employeeId name email role status createdAt"
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

// ✅ 권한 레벨 변경 (superadmin, admin, employee)
router.put("/update-role/:id", async (req, res) => {
  try {
    const { role } = req.body;

    if (!["superadmin", "admin", "employee"].includes(role)) {
      return res.status(400).json({ message: "잘못된 권한입니다." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    res.json({ success: true, updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "권한 변경 중 오류 발생" });
  }
});

// ✅ 시스템별 접근 권한 설정
router.put("/update-permissions/:id", async (req, res) => {
  try {
    const { permissions } = req.body;

    if (!permissions) {
      return res.status(400).json({ message: "권한 정보가 필요합니다." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { permissions },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    res.json({ success: true, message: "접근 권한이 업데이트되었습니다.", updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "권한 설정 중 오류 발생" });
  }
});

// ✅ 특정 사용자 정보 조회
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "사용자 정보 조회 중 오류 발생" });
  }
});

// ✅ 사용자 삭제
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    res.json({ message: "사용자가 삭제되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "사용자 삭제 중 오류 발생" });
  }
});

module.exports = router;
