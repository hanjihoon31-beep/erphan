// server/routes/adminRouter.js
const express = require("express");
const User = require("../models/User");
const { verifyToken, verifyAdmin, verifySuperAdmin } = require("../middleware/authMiddleware");

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

// ✅ 전체 사용자 목록 조회 (관리자용)
router.get("/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "사용자 목록 조회 오류" });
  }
});

// ✅ 퇴사 처리 (계정 비활성화)
router.put("/deactivate/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const targetUserId = req.params.id;

    // 자기 자신을 비활성화할 수 없도록 방지
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ message: "자기 자신을 비활성화할 수 없습니다." });
    }

    // 대상 사용자 조회
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // 이미 비활성화된 계정인지 확인
    if (targetUser.status === "inactive") {
      return res.status(400).json({ message: "이미 비활성화된 계정입니다." });
    }

    // 퇴사 처리
    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      {
        status: "inactive",
        inactivatedAt: new Date(),
        inactivatedBy: req.user._id,
        inactivationReason: reason || "퇴사"
      },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "계정이 비활성화되었습니다.",
      user: updatedUser
    });
  } catch (error) {
    console.error("퇴사 처리 오류:", error);
    res.status(500).json({ message: "퇴사 처리 중 오류 발생" });
  }
});

// ✅ 계정 재활성화
router.put("/reactivate/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const targetUserId = req.params.id;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    if (targetUser.status !== "inactive") {
      return res.status(400).json({ message: "비활성화된 계정이 아닙니다." });
    }

    // 재활성화
    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      {
        status: "active",
        $unset: { inactivatedAt: "", inactivatedBy: "", inactivationReason: "" }
      },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "계정이 재활성화되었습니다.",
      user: updatedUser
    });
  } catch (error) {
    console.error("재활성화 오류:", error);
    res.status(500).json({ message: "재활성화 중 오류 발생" });
  }
});

module.exports = router;
