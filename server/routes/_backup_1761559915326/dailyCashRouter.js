// server/routes/dailyCashRouter.js
import express from 'express';
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import DailyCash from "../models/DailyCash.js"';
import CashRequest from "../models/CashRequest.js"';
import Store from "../models/Store.js"';
import GiftCardType from "../models/GiftCardType.js"';

const router = express.Router();

// ==================== ?¼ì¼ ?œì¬ê¸?ê´€ë¦?====================

// ?¹ì • ? ì§œ???œì¬ê¸?ì¡°íšŒ
router.get("/store/:storeId/date/:date", verifyToken, async (req, res) => {
  try {
    const { storeId, date } = req.params;

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    let dailyCash = await DailyCash.findOne({
      store: storeId,
      date: targetDate
    })
      .populate("store", "storeNumber storeName")
      .populate("user", "name email")
      .populate("morningCheck.checkedBy", "name email")
      .populate("giftCards.type", "name")
      .populate("vouchers.voucherType", "category name");

    // ?†ìœ¼ë©??ë™ ?ì„±
    if (!dailyCash) {
      dailyCash = await DailyCash.create({
        store: storeId,
        date: targetDate,
        user: req.user._id,
        status: "?‘ì„±ì¤?
      });

      await dailyCash.populate("store", "storeNumber storeName");
      await dailyCash.populate("user", "name email");
    }

    res.json(dailyCash);
  } catch (error) {
    console.error("?œì¬ê¸?ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?œì¬ê¸?ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ?œì¬ê¸??•ë³´ ?…ë°?´íŠ¸ (?…ê¸ˆ, ?í’ˆê¶? ê¶Œë©´, ?´ì›”, ?ë§¤?•ë³´)
router.put("/store/:storeId/date/:date", verifyToken, async (req, res) => {
  try {
    const { storeId, date } = req.params;
    const { deposit, giftCards, vouchers, carryOver, sales, note } = req.body;

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    let dailyCash = await DailyCash.findOne({
      store: storeId,
      date: targetDate
    });

    if (!dailyCash) {
      dailyCash = new DailyCash({
        store: storeId,
        date: targetDate,
        user: req.user._id
      });
    }

    // ?…ê¸ˆ ?•ë³´ ?…ë°?´íŠ¸
    if (deposit) {
      dailyCash.deposit = deposit;
      dailyCash.calculateDepositTotal();
    }

    // ?í’ˆê¶??•ë³´ ?…ë°?´íŠ¸
    if (giftCards) {
      dailyCash.giftCards = giftCards;
    }

    // ê¶Œë©´ ?•ë³´ ?…ë°?´íŠ¸ (?¨í‚¤ì§€ê¶? ?°ì¼“)
    if (vouchers) {
      dailyCash.vouchers = vouchers;
    }

    // ?´ì›” ?œì¬ ?•ë³´ ?…ë°?´íŠ¸
    if (carryOver) {
      dailyCash.carryOver = carryOver;
      dailyCash.calculateCarryOverTotal();
    }

    // ?ë§¤ ?•ë³´ ?…ë°?´íŠ¸
    if (sales) {
      dailyCash.sales = sales;
    }

    // ë©”ëª¨
    if (note !== undefined) {
      dailyCash.note = note;
    }

    dailyCash.status = "?„ë£Œ";
    await dailyCash.save();

    await dailyCash.populate("store", "storeNumber storeName");
    await dailyCash.populate("user", "name email");
    await dailyCash.populate("giftCards.type", "name");
    await dailyCash.populate("vouchers.voucherType", "category name");

    res.json({ success: true, dailyCash });
  } catch (error) {
    console.error("?œì¬ê¸??…ë°?´íŠ¸ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?œì¬ê¸??…ë°?´íŠ¸ ?¤íŒ¨" });
  }
});

// ?¤ìŒ???„ì¹¨ ?œì¬ê¸??•ì¸
router.put("/store/:storeId/date/:date/morning-check", verifyToken, async (req, res) => {
  try {
    const { storeId, date } = req.params;
    const { morningCheck } = req.body;

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // ?„ë‚  ?°ì´??ì¡°íšŒ (?´ì›” ?œì¬?€ ë¹„êµ?˜ê¸° ?„í•´)
    const previousDate = new Date(targetDate);
    previousDate.setDate(previousDate.getDate() - 1);

    const previousDailyCash = await DailyCash.findOne({
      store: storeId,
      date: previousDate
    });

    let dailyCash = await DailyCash.findOne({
      store: storeId,
      date: targetDate
    });

    if (!dailyCash) {
      dailyCash = new DailyCash({
        store: storeId,
        date: targetDate,
        user: req.user._id
      });
    }

    // ?„ì¹¨ ?•ì¸ ?•ë³´ ?…ë°?´íŠ¸
    dailyCash.morningCheck = {
      ...morningCheck,
      checkedBy: req.user._id,
      checkedAt: new Date()
    };
    dailyCash.calculateMorningCheckTotal();

    // ?„ë‚  ?´ì›” ?œì¬?€ ë¹„êµ?˜ì—¬ ì°¨ì´ ?•ì¸
    if (previousDailyCash && previousDailyCash.carryOver.total > 0) {
      const diff = dailyCash.morningCheck.total - previousDailyCash.carryOver.total;
      dailyCash.discrepancy.amount = diff;
      dailyCash.discrepancy.hasDiscrepancy = diff !== 0;

      if (diff !== 0) {
        dailyCash.discrepancy.note = `?„ë‚  ?´ì›”: ${previousDailyCash.carryOver.total.toLocaleString()}?? ?¤ì œ: ${dailyCash.morningCheck.total.toLocaleString()}?? ì°¨ì´: ${diff.toLocaleString()}??;
      }
    } else {
      // ?„ë‚  ?°ì´???†ìœ¼ë©?ì°¨ì´ ?†ìŒ?¼ë¡œ ì²˜ë¦¬
      dailyCash.discrepancy.hasDiscrepancy = false;
      dailyCash.discrepancy.amount = 0;
    }

    await dailyCash.save();

    await dailyCash.populate("store", "storeNumber storeName");
    await dailyCash.populate("user", "name email");
    await dailyCash.populate("morningCheck.checkedBy", "name email");
    await dailyCash.populate("vouchers.voucherType", "category name");

    res.json({
      success: true,
      dailyCash,
      previousDailyCash: previousDailyCash ? {
        user: previousDailyCash.user,
        carryOver: previousDailyCash.carryOver
      } : null
    });
  } catch (error) {
    console.error("?„ì¹¨ ?œì¬ê¸??•ì¸ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?„ì¹¨ ?œì¬ê¸??•ì¸ ?¤íŒ¨" });
  }
});

// ?œì¬ê¸?ì°¨ì´ê°€ ?ˆëŠ” ?´ì—­ ì¡°íšŒ (ê´€ë¦¬ì)
router.get("/discrepancies", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { storeId, startDate, endDate } = req.query;

    let query = { "discrepancy.hasDiscrepancy": true };

    if (storeId) {
      query.store = storeId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const discrepancies = await DailyCash.find(query)
      .populate("store", "storeNumber storeName")
      .populate("user", "name email")
      .populate("morningCheck.checkedBy", "name email")
      .populate("vouchers.voucherType", "category name")
      .sort({ date: -1 })
      .limit(100);

    // ê°?ì°¨ì´ ê±´ì— ?€???„ë‚  ê·¼ë¬´???•ë³´???¬í•¨
    const enrichedDiscrepancies = await Promise.all(
      discrepancies.map(async (item) => {
        const previousDate = new Date(item.date);
        previousDate.setDate(previousDate.getDate() - 1);

        const previousDailyCash = await DailyCash.findOne({
          store: item.store._id,
          date: previousDate
        }).populate("user", "name email");

        return {
          ...item.toObject(),
          previousDayUser: previousDailyCash ? previousDailyCash.user : null
        };
      })
    );

    res.json(enrichedDiscrepancies);
  } catch (error) {
    console.error("?œì¬ê¸?ì°¨ì´ ?´ì—­ ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?œì¬ê¸?ì°¨ì´ ?´ì—­ ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ê¸°ê°„ë³??œì¬ê¸??´ì—­ ì¡°íšŒ
router.get("/history", verifyToken, async (req, res) => {
  try {
    const { storeId, startDate, endDate } = req.query;

    let query = {};

    if (storeId) {
      query.store = storeId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const history = await DailyCash.find(query)
      .populate("store", "storeNumber storeName")
      .populate("user", "name email")
      .populate("morningCheck.checkedBy", "name email")
      .populate("giftCards.type", "name")
      .populate("vouchers.voucherType", "category name")
      .sort({ date: -1 })
      .limit(100);

    res.json(history);
  } catch (error) {
    console.error("?œì¬ê¸??´ì—­ ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?œì¬ê¸??´ì—­ ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ==================== ?œì¬ê¸?ì²?µ¬ ê´€ë¦?====================

// ?œì¬ê¸?ì²?µ¬ ?±ë¡
router.post("/request", verifyToken, async (req, res) => {
  try {
    const { storeId, date, items, note } = req.body;

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const request = await CashRequest.create({
      store: storeId,
      date: targetDate,
      requestedBy: req.user._id,
      items,
      note
    });

    await request.populate("store", "storeNumber storeName");
    await request.populate("requestedBy", "name email");

    res.status(201).json({ success: true, request });
  } catch (error) {
    console.error("?œì¬ê¸?ì²?µ¬ ?±ë¡ ?¤ë¥˜:", error);

    // ? íš¨??ê²€ì¦??¤ë¥˜ ì²˜ë¦¬
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: "?œì¬ê¸?ì²?µ¬ ?±ë¡ ?¤íŒ¨" });
  }
});

// ?œì¬ê¸?ì²?µ¬ ëª©ë¡ ì¡°íšŒ
router.get("/requests", verifyToken, async (req, res) => {
  try {
    const { storeId, status } = req.query;

    let query = {};

    if (storeId) {
      query.store = storeId;
    }

    if (status) {
      query.status = status;
    }

    const requests = await CashRequest.find(query)
      .populate("store", "storeNumber storeName")
      .populate("requestedBy", "name email")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(requests);
  } catch (error) {
    console.error("?œì¬ê¸?ì²?µ¬ ëª©ë¡ ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?œì¬ê¸?ì²?µ¬ ëª©ë¡ ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ?œì¬ê¸?ì²?µ¬ ?¹ì¸ (ê´€ë¦¬ì)
router.patch("/request/:id/approve", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const request = await CashRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "ì²?µ¬ ?´ì—­??ì°¾ì„ ???†ìŠµ?ˆë‹¤." });
    }

    if (request.status !== "?€ê¸?) {
      return res.status(400).json({ message: "?´ë? ì²˜ë¦¬??ì²?µ¬?…ë‹ˆ??" });
    }

    request.status = "?¹ì¸";
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();

    await request.save();

    await request.populate("store", "storeNumber storeName");
    await request.populate("requestedBy", "name email");
    await request.populate("approvedBy", "name email");

    res.json({ success: true, request });
  } catch (error) {
    console.error("?œì¬ê¸?ì²?µ¬ ?¹ì¸ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?œì¬ê¸?ì²?µ¬ ?¹ì¸ ?¤íŒ¨" });
  }
});

// ?œì¬ê¸?ì²?µ¬ ê±°ë? (ê´€ë¦¬ì)
router.patch("/request/:id/reject", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const request = await CashRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "ì²?µ¬ ?´ì—­??ì°¾ì„ ???†ìŠµ?ˆë‹¤." });
    }

    if (request.status !== "?€ê¸?) {
      return res.status(400).json({ message: "?´ë? ì²˜ë¦¬??ì²?µ¬?…ë‹ˆ??" });
    }

    request.status = "ê±°ë?";
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    request.rejectionReason = rejectionReason;

    await request.save();

    await request.populate("store", "storeNumber storeName");
    await request.populate("requestedBy", "name email");
    await request.populate("approvedBy", "name email");

    res.json({ success: true, request });
  } catch (error) {
    console.error("?œì¬ê¸?ì²?µ¬ ê±°ë? ?¤ë¥˜:", error);
    res.status(500).json({ message: "?œì¬ê¸?ì²?µ¬ ê±°ë? ?¤íŒ¨" });
  }
});

export default router;
