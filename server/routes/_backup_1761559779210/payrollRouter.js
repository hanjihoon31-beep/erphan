// server/routes/payrollRouter.js
import express from 'express';
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
import Attendance from '../models/Attendance';
import AttendanceModificationRequest from '../models/AttendanceModificationRequest';
import WageSettings from '../models/WageSettings';
import MealCostHistory from '../models/MealCostHistory';

const router = express.Router();

// ==================== ê·¼íƒœ ?˜ì • ?”ì²­ (ê·¼ë¬´?? ====================

// ê·¼íƒœ ?˜ì • ?”ì²­ ?ì„±
router.post("/modification-request", verifyToken, async (req, res) => {
  try {
    const { attendanceId, modifications, reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "?˜ì • ?¬ìœ ë¥??…ë ¥?´ì£¼?¸ìš”." });
    }

    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({ message: "ê·¼íƒœ ê¸°ë¡??ì°¾ì„ ???†ìŠµ?ˆë‹¤." });
    }

    // ë³¸ì¸ ê·¼íƒœë§??˜ì • ?”ì²­ ê°€??
    if (attendance.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "ê¶Œí•œ???†ìŠµ?ˆë‹¤." });
    }

    // ?˜ì • ?”ì²­ ?ì„±
    const modRequest = await AttendanceModificationRequest.create({
      attendance: attendanceId,
      requestedBy: req.user._id,
      modifications,
      reason
    });

    const populated = await AttendanceModificationRequest.findById(modRequest._id)
      .populate("attendance")
      .populate("requestedBy", "name email");

    res.status(201).json({ success: true, request: populated });
  } catch (error) {
    console.error("?˜ì • ?”ì²­ ?ì„± ?¤ë¥˜:", error);
    res.status(500).json({ message: "?˜ì • ?”ì²­ ?ì„± ?¤íŒ¨" });
  }
});

// ë³¸ì¸ ?˜ì • ?”ì²­ ëª©ë¡ ì¡°íšŒ
router.get("/my-modification-requests", verifyToken, async (req, res) => {
  try {
    const requests = await AttendanceModificationRequest.find({
      requestedBy: req.user._id
    })
      .populate("attendance")
      .populate("reviewedBy", "name email")
      .sort({ requestedAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("?˜ì • ?”ì²­ ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?˜ì • ?”ì²­ ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ==================== ê·¼íƒœ ?˜ì • ?”ì²­ ?¹ì¸/ê±°ë? (ê´€ë¦¬ìž) ====================

// ?€ê¸?ì¤‘ì¸ ?˜ì • ?”ì²­ ëª©ë¡ ì¡°íšŒ
router.get("/modification-requests/pending", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const requests = await AttendanceModificationRequest.find({
      status: "?€ê¸?
    })
      .populate({
        path: "attendance",
        populate: [
          { path: "user", select: "name email" },
          { path: "store", select: "storeNumber storeName" }
        ]
      })
      .populate("requestedBy", "name email")
      .sort({ requestedAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("?€ê¸??”ì²­ ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?€ê¸??”ì²­ ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ?˜ì • ?”ì²­ ?¹ì¸
router.put("/modification-requests/:id/approve", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const modRequest = await AttendanceModificationRequest.findById(req.params.id);

    if (!modRequest) {
      return res.status(404).json({ message: "?˜ì • ?”ì²­??ì°¾ì„ ???†ìŠµ?ˆë‹¤." });
    }

    if (modRequest.status !== "?€ê¸?) {
      return res.status(400).json({ message: "?´ë? ì²˜ë¦¬???”ì²­?…ë‹ˆ??" });
    }

    // ê·¼íƒœ ?•ë³´ ?˜ì •
    const attendance = await Attendance.findById(modRequest.attendance);

    if (!attendance) {
      return res.status(404).json({ message: "ê·¼íƒœ ê¸°ë¡??ì°¾ì„ ???†ìŠµ?ˆë‹¤." });
    }

    const { modifications } = modRequest;

    if (modifications.checkInTime) {
      attendance.checkInTime = new Date(modifications.checkInTime);
    }
    if (modifications.checkOutTime) {
      attendance.checkOutTime = new Date(modifications.checkOutTime);
    }
    if (modifications.workType) {
      attendance.workType = modifications.workType;
    }
    if (modifications.breakMinutes !== undefined) {
      attendance.breakMinutes = modifications.breakMinutes;
    }
    if (modifications.notes) {
      attendance.notes = modifications.notes;
    }
    if (modifications.lateReason) {
      attendance.lateReason = modifications.lateReason;
    }

    attendance.lastModifiedBy = req.user._id;
    attendance.updatedAt = new Date();

    // ê·¼ë¬´?œê°„ ?¬ê³„??
    if (attendance.checkInTime && attendance.checkOutTime) {
      attendance.calculateWorkTime();
    }

    await attendance.save();

    // ?”ì²­ ?íƒœ ?…ë°?´íŠ¸
    modRequest.status = "?¹ì¸";
    modRequest.reviewedBy = req.user._id;
    modRequest.reviewedAt = new Date();
    await modRequest.save();

    res.json({ success: true, message: "?˜ì • ?”ì²­???¹ì¸?˜ì—ˆ?µë‹ˆ??" });
  } catch (error) {
    console.error("?˜ì • ?”ì²­ ?¹ì¸ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?˜ì • ?”ì²­ ?¹ì¸ ?¤íŒ¨" });
  }
});

// ?˜ì • ?”ì²­ ê±°ë?
router.put("/modification-requests/:id/reject", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: "ê±°ë? ?¬ìœ ë¥??…ë ¥?´ì£¼?¸ìš”." });
    }

    const modRequest = await AttendanceModificationRequest.findById(req.params.id);

    if (!modRequest) {
      return res.status(404).json({ message: "?˜ì • ?”ì²­??ì°¾ì„ ???†ìŠµ?ˆë‹¤." });
    }

    if (modRequest.status !== "?€ê¸?) {
      return res.status(400).json({ message: "?´ë? ì²˜ë¦¬???”ì²­?…ë‹ˆ??" });
    }

    modRequest.status = "ê±°ë?";
    modRequest.rejectionReason = rejectionReason;
    modRequest.reviewedBy = req.user._id;
    modRequest.reviewedAt = new Date();
    await modRequest.save();

    res.json({ success: true, message: "?˜ì • ?”ì²­??ê±°ë??˜ì—ˆ?µë‹ˆ??" });
  } catch (error) {
    console.error("?˜ì • ?”ì²­ ê±°ë? ?¤ë¥˜:", error);
    res.status(500).json({ message: "?˜ì • ?”ì²­ ê±°ë? ?¤íŒ¨" });
  }
});

// ==================== ê¸‰ì—¬ ê³„ì‚° ====================

// ?¹ì • ?¬ìš©?ì˜ ?”ê°„ ê¸‰ì—¬ ê³„ì‚°
router.get("/calculate/:userId/:yearMonth", verifyToken, async (req, res) => {
  try {
    const { userId, yearMonth } = req.params; // yearMonth: "2025-10"

    const [year, month] = yearMonth.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // ?´ë‹¹ ?”ì˜ ê·¼íƒœ ê¸°ë¡ ì¡°íšŒ
    const attendances = await Attendance.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    }).populate("user", "name email");

    if (attendances.length === 0) {
      return res.json({
        userId,
        yearMonth,
        totalWorkMinutes: 0,
        totalHours: 0,
        totalPay: 0,
        totalMealCost: 0,
        breakdown: {}
      });
    }

    // ê¸‰ì—¬ ê³„ì‚°
    const breakdown = {
      normalWorkMinutes: 0,
      overtimeMinutes: 0,
      additionalMinutes: 0,
      incentiveMinutes: 0,
      totalMealCount: 0,
      annualLeaveAllowance: 0,
      details: []
    };

    for (const att of attendances) {
      const detail = {
        date: att.date,
        workType: att.workType,
        checkInTime: att.checkInTime,
        checkOutTime: att.checkOutTime,
        actualWorkMinutes: att.actualWorkMinutes,
        overtimeMinutes: att.overtimeMinutes,
        mealCount: att.mealCount + att.additionalMealCount
      };

      // ëª¨ë“  ê·¼ë¬´?œê°„??normalWorkMinutesë¡??µí•©
      breakdown.normalWorkMinutes += att.actualWorkMinutes;

      breakdown.overtimeMinutes += att.overtimeMinutes || 0;
      breakdown.additionalMinutes += att.additionalMinutes || 0;
      breakdown.incentiveMinutes += att.incentiveMinutes || 0;
      breakdown.totalMealCount += (att.mealCount || 0) + (att.additionalMealCount || 0);
      breakdown.annualLeaveAllowance += att.annualLeaveAllowance || 0;

      breakdown.details.push(detail);
    }

    // ?œê¸‰ ì¡°íšŒ (?´ë‹¹ ??ê¸°ì?)
    const wageSettings = await WageSettings.findOne({
      user: userId,
      effectiveDate: { $lte: endDate }
    }).sort({ effectiveDate: -1 });

    const hourlyWage = wageSettings?.hourlyWage || 10500;

    // ê¸‰ì—¬ ê³„ì‚°
    const normalPay = Math.floor((breakdown.normalWorkMinutes / 60) * hourlyWage);
    const overtimePay = Math.floor((breakdown.overtimeMinutes / 60) * hourlyWage);
    const additionalPay = Math.floor((breakdown.additionalMinutes / 60) * hourlyWage);
    const incentivePay = Math.floor((breakdown.incentiveMinutes / 60) * hourlyWage);

    // ?ë? ê³„ì‚° (? ì§œë³??ë? ê¸ˆì•¡ ?ìš©)
    let totalMealCost = 0;
    for (const att of attendances) {
      const mealCost = await MealCostHistory.findOne({
        effectiveDate: { $lte: att.date },
        $or: [
          { endDate: { $gte: att.date } },
          { endDate: null }
        ]
      });

      const mealPrice = mealCost?.mealCost || 8500;
      totalMealCost += (att.mealCount + att.additionalMealCount) * mealPrice;
    }

    const totalPay = normalPay + overtimePay + additionalPay + incentivePay + breakdown.annualLeaveAllowance;
    const totalWorkMinutes = breakdown.normalWorkMinutes + breakdown.additionalMinutes + breakdown.incentiveMinutes;

    res.json({
      userId,
      yearMonth,
      hourlyWage,
      totalWorkMinutes,
      totalHours: (totalWorkMinutes / 60).toFixed(2),
      normalPay,
      overtimePay,
      additionalPay,
      incentivePay,
      annualLeaveAllowance: breakdown.annualLeaveAllowance,
      totalPay,
      totalMealCost,
      totalCompensation: totalPay + totalMealCost,
      breakdown,
      attendanceCount: attendances.length
    });
  } catch (error) {
    console.error("ê¸‰ì—¬ ê³„ì‚° ?¤ë¥˜:", error);
    res.status(500).json({ message: "ê¸‰ì—¬ ê³„ì‚° ?¤íŒ¨" });
  }
});

// ?„ì²´ ì§ì› ?”ê°„ ê¸‰ì—¬ ê³„ì‚° (ê´€ë¦¬ìž)
router.get("/calculate-all/:yearMonth", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { yearMonth } = req.params;

    const [year, month] = yearMonth.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // ?´ë‹¹ ?”ì— ê·¼ë¬´??ëª¨ë“  ?¬ìš©??ì¡°íšŒ
    const attendances = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate("user", "name email");

    const userIds = [...new Set(attendances.map(att => att.user._id.toString()))];

    const payrolls = [];

    for (const userId of userIds) {
      const userAttendances = attendances.filter(att => att.user._id.toString() === userId);

      const breakdown = {
        normalWorkMinutes: 0,
        overtimeMinutes: 0,
        additionalMinutes: 0,
        incentiveMinutes: 0,
        totalMealCount: 0,
        annualLeaveAllowance: 0
      };

      for (const att of userAttendances) {
        // ëª¨ë“  ê·¼ë¬´?œê°„??normalWorkMinutesë¡??µí•©
        breakdown.normalWorkMinutes += att.actualWorkMinutes;

        breakdown.overtimeMinutes += att.overtimeMinutes || 0;
        breakdown.additionalMinutes += att.additionalMinutes || 0;
        breakdown.incentiveMinutes += att.incentiveMinutes || 0;
        breakdown.totalMealCount += (att.mealCount || 0) + (att.additionalMealCount || 0);
        breakdown.annualLeaveAllowance += att.annualLeaveAllowance || 0;
      }

      // ?œê¸‰ ì¡°íšŒ
      const wageSettings = await WageSettings.findOne({
        user: userId,
        effectiveDate: { $lte: endDate }
      }).sort({ effectiveDate: -1 });

      const hourlyWage = wageSettings?.hourlyWage || 10500;

      const normalPay = Math.floor((breakdown.normalWorkMinutes / 60) * hourlyWage);
      const overtimePay = Math.floor((breakdown.overtimeMinutes / 60) * hourlyWage);
      const additionalPay = Math.floor((breakdown.additionalMinutes / 60) * hourlyWage);
      const incentivePay = Math.floor((breakdown.incentiveMinutes / 60) * hourlyWage);

      // ?ë? ê³„ì‚°
      let totalMealCost = 0;
      for (const att of userAttendances) {
        const mealCost = await MealCostHistory.findOne({
          effectiveDate: { $lte: att.date },
          $or: [{ endDate: { $gte: att.date } }, { endDate: null }]
        });
        const mealPrice = mealCost?.mealCost || 8500;
        totalMealCost += (att.mealCount + att.additionalMealCount) * mealPrice;
      }

      const totalPay = normalPay + overtimePay + additionalPay + incentivePay + breakdown.annualLeaveAllowance;

      payrolls.push({
        userId,
        userName: userAttendances[0].user.name,
        userEmail: userAttendances[0].user.email,
        hourlyWage,
        normalPay,
        overtimePay,
        additionalPay,
        incentivePay,
        annualLeaveAllowance: breakdown.annualLeaveAllowance,
        totalPay,
        totalMealCost,
        totalCompensation: totalPay + totalMealCost,
        attendanceCount: userAttendances.length,
        breakdown
      });
    }

    res.json({
      yearMonth,
      totalEmployees: payrolls.length,
      payrolls,
      grandTotal: payrolls.reduce((sum, p) => sum + p.totalCompensation, 0)
    });
  } catch (error) {
    console.error("?„ì²´ ê¸‰ì—¬ ê³„ì‚° ?¤ë¥˜:", error);
    res.status(500).json({ message: "?„ì²´ ê¸‰ì—¬ ê³„ì‚° ?¤íŒ¨" });
  }
});

export default router;
