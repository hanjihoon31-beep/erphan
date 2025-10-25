// server/routes/adminRouter.js
const express = require("express");
const User = require("../models/User");
const { authenticate, authorize } = require("../middleware/auth");
const { validateRoleUpdate, validateObjectId } = require("../middleware/validation");

const router = express.Router();

// ✅ 모든 admin 라우트에 인증 및 권한 체크 적용

// ✅ 승인 대기중 유저 목록 조회 (admin 이상만 접근 가능)
router.get("/pending", authenticate, authorize("admin", "superadmin"), async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: "pending" })
      .select("name email role status createdAt")
      .sort({ createdAt: -1 }); // 최신순 정렬

    res.json(pendingUsers);
  } catch (error) {
    console.error("Fetch pending users error:", error.message);
    res.status(500).json({ message: "승인 목록을 불러오는 중 오류가 발생했습니다." });
  }
});

// ✅ 계정 승인 (admin 이상만 접근 가능)
router.put("/approve/:id", authenticate, authorize("admin", "superadmin"), validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    if (user.status !== "pending") {
      return res.status(400).json({ message: "승인 대기 상태가 아닙니다." });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    ).select("-password"); // 비밀번호 제외

    res.json({
      message: "계정이 승인되었습니다.",
      user: updated
    });
  } catch (error) {
    console.error("Approve user error:", error.message);
    res.status(500).json({ message: "승인 처리 중 오류가 발생했습니다." });
  }
});

// ✅ 계정 거절 (admin 이상만 접근 가능)
router.put("/reject/:id", authenticate, authorize("admin", "superadmin"), validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    if (user.status !== "pending") {
      return res.status(400).json({ message: "승인 대기 상태가 아닙니다." });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    ).select("-password"); // 비밀번호 제외

    res.json({
      message: "계정이 거절되었습니다.",
      user: updated
    });
  } catch (error) {
    console.error("Reject user error:", error.message);
    res.status(500).json({ message: "거절 처리 중 오류가 발생했습니다." });
  }
});

// ✅ 권한 변경 (superadmin만 접근 가능)
router.put("/update-role/:id", authenticate, authorize("superadmin"), validateObjectId, validateRoleUpdate, async (req, res) => {
  try {
    const { role } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // 자기 자신의 권한은 변경할 수 없음
    if (req.userId.toString() === req.params.id) {
      return res.status(400).json({ message: "자신의 권한은 변경할 수 없습니다." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password"); // 비밀번호 제외

    res.json({
      success: true,
      message: "권한이 변경되었습니다.",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update role error:", error.message);
    res.status(500).json({
      success: false,
      message: "권한 변경 중 오류가 발생했습니다."
    });
  }
});

// ✅ 전체 사용자 목록 조회 (admin 이상만 접근 가능)
router.get("/users", authenticate, authorize("admin", "superadmin"), async (req, res) => {
  try {
    const users = await User.find({ status: "active" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error("Fetch users error:", error.message);
    res.status(500).json({ message: "사용자 목록을 불러오는 중 오류가 발생했습니다." });
  }
});

// ✅ 사용자 계정 비활성화 (superadmin만 접근 가능)
router.put("/deactivate/:id", authenticate, authorize("superadmin"), validateObjectId, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // 자기 자신은 비활성화할 수 없음
    if (req.userId.toString() === req.params.id) {
      return res.status(400).json({ message: "자신의 계정은 비활성화할 수 없습니다." });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    ).select("-password");

    res.json({
      message: "계정이 비활성화되었습니다.",
      user: updated
    });
  } catch (error) {
    console.error("Deactivate user error:", error.message);
    res.status(500).json({ message: "계정 비활성화 중 오류가 발생했습니다." });
  }
});

module.exports = router;
