// server/routes/attendanceRouter.js
import express from 'express';
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
import Attendance from '../models/Attendance';
import AttendanceModificationRequest from '../models/AttendanceModificationRequest';
import WorkScheduleSettings from '../models/WorkScheduleSettings';
import WageSettings from '../models/WageSettings';
import MealCostHistory from '../models/MealCostHistory';
import Holiday from '../models/Holiday';
import User from '../models/User';

const router = express.Router();

// ==================== ê·¼ë¬´?œê°„ ?¤ì • ê´€ë¦?(ê´€ë¦¬ì) ====================

// ë§¤ì¥ë³?ê·¼ë¬´?œê°„ ?¤ì • ì¡°íšŒ
router.get("/schedule-settings/:storeId", verifyToken, async (req, res) => {
  try {
    let settings = await WorkScheduleSettings.findOne({ store: req.params.storeId })
      .populate("store", "storeNumber storeName")
      .populate("lastModifiedBy", "name email");

    // ?¤ì •???†ìœ¼ë©?ê¸°ë³¸ê°??ì„±
    if (!settings) {
      settings = await WorkScheduleSettings.create({
        store: req.params.storeId,
        lastModifiedBy: req.user._id
      });
    }

    res.json(settings);
  } catch (error) {
    console.error("ê·¼ë¬´?œê°„ ?¤ì • ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "ê·¼ë¬´?œê°„ ?¤ì • ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ê·¼ë¬´?œê°„ ?¤ì • ?˜ì • (ê´€ë¦¬ì)
router.put("/schedule-settings/:storeId", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const {
      weekdayStartTime,
      weekendStartTime,
      storeClosingTime,
      endTimeOffsetHours,
      breakTimeMinutes,
      lateThresholdMinutes,
      earlyLeaveThresholdMinutes
    } = req.body;

    let settings = await WorkScheduleSettings.findOne({ store: req.params.storeId });

    if (!settings) {
      settings = new WorkScheduleSettings({ store: req.params.storeId });
    }

    if (weekdayStartTime) settings.weekdayStartTime = weekdayStartTime;
    if (weekendStartTime) settings.weekendStartTime = weekendStartTime;
    if (storeClosingTime) settings.storeClosingTime = storeClosingTime;
    if (endTimeOffsetHours !== undefined) settings.endTimeOffsetHours = endTimeOffsetHours;
    if (breakTimeMinutes !== undefined) settings.breakTimeMinutes = breakTimeMinutes;
    if (lateThresholdMinutes !== undefined) settings.lateThresholdMinutes = lateThresholdMinutes;
    if (earlyLeaveThresholdMinutes !== undefined) settings.earlyLeaveThresholdMinutes = earlyLeaveThresholdMinutes;

    settings.lastModifiedBy = req.user._id;
    settings.updatedAt = new Date();

    await settings.save();

    res.json({ success: true, settings });
  } catch (error) {
    console.error("ê·¼ë¬´?œê°„ ?¤ì • ?˜ì • ?¤ë¥˜:", error);
    res.status(500).json({ message: "ê·¼ë¬´?œê°„ ?¤ì • ?˜ì • ?¤íŒ¨" });
  }
});

// ==================== ?œê¸‰ ê´€ë¦?(ê´€ë¦¬ì) ====================

// ?¹ì • ?¬ìš©?ì˜ ?„ì¬ ?œê¸‰ ì¡°íšŒ
router.get("/wage/:userId", verifyToken, async (req, res) => {
  try {
    const latestWage = await WageSettings.findOne({ user: req.params.userId })
      .sort({ effectiveDate: -1 })
      .populate("setBy", "name email");

    if (!latestWage) {
      return res.json({ hourlyWage: 10500 }); // ê¸°ë³¸ê°?
    }

    res.json(latestWage);
  } catch (error) {
    console.error("?œê¸‰ ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?œê¸‰ ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ?œê¸‰ ?¤ì • (ê°œë³„)
router.post("/wage", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId, hourlyWage, effectiveDate, notes } = req.body;

    const wage = await WageSettings.create({
      user: userId,
      hourlyWage,
      effectiveDate: effectiveDate || new Date(),
      notes,
      setBy: req.user._id
    });

    res.status(201).json({ success: true, wage });
  } catch (error) {
    console.error("?œê¸‰ ?¤ì • ?¤ë¥˜:", error);
    res.status(500).json({ message: "?œê¸‰ ?¤ì • ?¤íŒ¨" });
  }
});

// ?œê¸‰ ?¼ê´„ ?¤ì •
router.post("/wage/bulk", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userIds, hourlyWage, effectiveDate, notes } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "?¬ìš©??ëª©ë¡???„ìš”?©ë‹ˆ??" });
    }

    const wages = userIds.map(userId => ({
      user: userId,
      hourlyWage,
      effectiveDate: effectiveDate || new Date(),
      notes,
      setBy: req.user._id
    }));

    await WageSettings.insertMany(wages);

    res.json({ success: true, message: `${userIds.length}ëª…ì˜ ?œê¸‰???¤ì •?˜ì—ˆ?µë‹ˆ??` });
  } catch (error) {
    console.error("?œê¸‰ ?¼ê´„ ?¤ì • ?¤ë¥˜:", error);
    res.status(500).json({ message: "?œê¸‰ ?¼ê´„ ?¤ì • ?¤íŒ¨" });
  }
});

// ==================== ?ë? ê´€ë¦?(ê´€ë¦¬ì) ====================

// ?„ì¬ ?ë? ê¸ˆì•¡ ì¡°íšŒ
router.get("/meal-cost/current", verifyToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentMealCost = await MealCostHistory.findOne({
      effectiveDate: { $lte: today },
      $or: [
        { endDate: { $gte: today } },
        { endDate: null }
      ]
    }).sort({ effectiveDate: -1 });

    if (!currentMealCost) {
      return res.json({ mealCost: 8500 }); // ê¸°ë³¸ê°?
    }

    res.json(currentMealCost);
  } catch (error) {
    console.error("?ë? ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?ë? ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ?¹ì • ? ì§œ???ë? ê¸ˆì•¡ ì¡°íšŒ
router.get("/meal-cost/:date", verifyToken, async (req, res) => {
  try {
    const targetDate = new Date(req.params.date);
    targetDate.setHours(0, 0, 0, 0);

    const mealCost = await MealCostHistory.findOne({
      effectiveDate: { $lte: targetDate },
      $or: [
        { endDate: { $gte: targetDate } },
        { endDate: null }
      ]
    });

    res.json({ mealCost: mealCost ? mealCost.mealCost : 8500 });
  } catch (error) {
    console.error("?ë? ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?ë? ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ?ë? ê¸ˆì•¡ ?¤ì •
router.post("/meal-cost", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { mealCost, effectiveDate, notes } = req.body;

    const newEffectiveDate = new Date(effectiveDate || new Date());
    newEffectiveDate.setHours(0, 0, 0, 0);

    // ?´ì „ ?ë? ?¤ì •??ì¢…ë£Œ???…ë°?´íŠ¸
    const previousMealCost = await MealCostHistory.findOne({
      effectiveDate: { $lt: newEffectiveDate },
      endDate: null
    }).sort({ effectiveDate: -1 });

    if (previousMealCost) {
      const endDate = new Date(newEffectiveDate);
      endDate.setDate(endDate.getDate() - 1);
      previousMealCost.endDate = endDate;
      await previousMealCost.save();
    }

    // ???ë? ?¤ì • ?ì„±
    const newMealCost = await MealCostHistory.create({
      mealCost,
      effectiveDate: newEffectiveDate,
      notes,
      setBy: req.user._id
    });

    res.status(201).json({ success: true, mealCost: newMealCost });
  } catch (error) {
    console.error("?ë? ?¤ì • ?¤ë¥˜:", error);
    res.status(500).json({ message: "?ë? ?¤ì • ?¤íŒ¨" });
  }
});

// ?ë? ?´ë ¥ ì¡°íšŒ
router.get("/meal-cost-history", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const history = await MealCostHistory.find()
      .sort({ effectiveDate: -1 })
      .populate("setBy", "name email")
      .limit(50);

    res.json(history);
  } catch (error) {
    console.error("?ë? ?´ë ¥ ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?ë? ?´ë ¥ ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ==================== ê³µíœ´??ê´€ë¦?(ê´€ë¦¬ì) ====================

// ê³µíœ´??ëª©ë¡ ì¡°íšŒ
router.get("/holidays", verifyToken, async (req, res) => {
  try {
    const { year } = req.query;

    let query = {};
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const holidays = await Holiday.find(query)
      .sort({ date: 1 })
      .populate("registeredBy", "name email");

    res.json(holidays);
  } catch (error) {
    console.error("ê³µíœ´??ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "ê³µíœ´??ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ê³µíœ´???±ë¡
router.post("/holidays", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { date, name, type, isWorkingDay } = req.body;

    const holiday = await Holiday.create({
      date: new Date(date),
      name,
      type: type || "ë²•ì •ê³µíœ´??,
      isWorkingDay: isWorkingDay || false,
      registeredBy: req.user._id
    });

    res.status(201).json({ success: true, holiday });
  } catch (error) {
    console.error("ê³µíœ´???±ë¡ ?¤ë¥˜:", error);
    res.status(500).json({ message: "ê³µíœ´???±ë¡ ?¤íŒ¨" });
  }
});

// ê³µíœ´???? œ
router.delete("/holidays/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "ê³µíœ´?¼ì´ ?? œ?˜ì—ˆ?µë‹ˆ??" });
  } catch (error) {
    console.error("ê³µíœ´???? œ ?¤ë¥˜:", error);
    res.status(500).json({ message: "ê³µíœ´???? œ ?¤íŒ¨" });
  }
});

// ?¹ì • ? ì§œê°€ ê³µíœ´?¼ì¸ì§€ ?•ì¸
router.get("/holidays/check/:date", verifyToken, async (req, res) => {
  try {
    const targetDate = new Date(req.params.date);
    targetDate.setHours(0, 0, 0, 0);

    const holiday = await Holiday.findOne({ date: targetDate });

    res.json({
      isHoliday: !!holiday,
      holiday: holiday || null
    });
  } catch (error) {
    console.error("ê³µíœ´???•ì¸ ?¤ë¥˜:", error);
    res.status(500).json({ message: "ê³µíœ´???•ì¸ ?¤íŒ¨" });
  }
});

export default router;
