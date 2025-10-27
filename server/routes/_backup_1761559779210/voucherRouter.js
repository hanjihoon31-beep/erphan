// server/routes/voucherRouter.js
import express from 'express';
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
import VoucherType from '../models/VoucherType';

const router = express.Router();

// ==================== ê¶Œë©´ ?€??ê´€ë¦?====================

// ëª¨ë“  ê¶Œë©´ ?€??ì¡°íšŒ
router.get("/", verifyToken, async (req, res) => {
  try {
    const { category, includeInactive } = req.query;

    let query = {};

    if (category) {
      query.category = category;
    }

    if (!includeInactive) {
      query.isActive = true;
    }

    const vouchers = await VoucherType.find(query)
      .populate("createdBy", "name email")
      .populate("lastModifiedBy", "name email")
      .populate("deactivatedBy", "name email")
      .sort({ category: 1, createdAt: -1 });

    res.json(vouchers);
  } catch (error) {
    console.error("ê¶Œë©´ ?€??ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "ê¶Œë©´ ?€??ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ?¹ì • ê¶Œë©´ ?€??ì¡°íšŒ
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const voucher = await VoucherType.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("lastModifiedBy", "name email");

    if (!voucher) {
      return res.status(404).json({ message: "ê¶Œë©´ ?€?…ì„ ì°¾ì„ ???†ìŠµ?ˆë‹¤." });
    }

    res.json(voucher);
  } catch (error) {
    console.error("ê¶Œë©´ ?€??ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "ê¶Œë©´ ?€??ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ê¶Œë©´ ?€???±ë¡ (ê·¼ë¬´??ê°€??
router.post("/", verifyToken, async (req, res) => {
  try {
    const { category, name } = req.body;

    if (!category || !name || !name.trim()) {
      return res.status(400).json({
        message: "ì¹´í…Œê³ ë¦¬?€ ê¶Œì¢…ëª…ì„ ?…ë ¥?´ì£¼?¸ìš”."
      });
    }

    if (!["?¨í‚¤ì§€ê¶?, "?°ì¼“"].includes(category)) {
      return res.status(400).json({
        message: "ì¹´í…Œê³ ë¦¬??'?¨í‚¤ì§€ê¶? ?ëŠ” '?°ì¼“'ë§?ê°€?¥í•©?ˆë‹¤."
      });
    }

    // ì¤‘ë³µ ?•ì¸ (ê°™ì? ì¹´í…Œê³ ë¦¬ ?´ì—??
    const existing = await VoucherType.findOne({
      category,
      name: name.trim(),
      isActive: true
    });

    if (existing) {
      return res.status(400).json({
        message: "?´ë? ?±ë¡??ê¶Œì¢…ëª…ì…?ˆë‹¤."
      });
    }

    const voucher = await VoucherType.create({
      category,
      name: name.trim(),
      createdBy: req.user._id,
      isSystemDefined: false
    });

    await voucher.populate("createdBy", "name email");

    res.status(201).json({ success: true, voucher });
  } catch (error) {
    console.error("ê¶Œë©´ ?€???±ë¡ ?¤ë¥˜:", error);
    res.status(500).json({ message: "ê¶Œë©´ ?€???±ë¡ ?¤íŒ¨" });
  }
});

// ê¶Œë©´ ?€???´ë¦„ ?˜ì • (ê´€ë¦¬ì)
router.put("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "ê¶Œì¢…ëª…ì„ ?…ë ¥?´ì£¼?¸ìš”."
      });
    }

    const voucher = await VoucherType.findById(req.params.id);

    if (!voucher) {
      return res.status(404).json({ message: "ê¶Œë©´ ?€?…ì„ ì°¾ì„ ???†ìŠµ?ˆë‹¤." });
    }

    // ì¤‘ë³µ ?•ì¸ (ê°™ì? ì¹´í…Œê³ ë¦¬ ?´ì—?? ?ê¸° ?ì‹  ?œì™¸)
    const existing = await VoucherType.findOne({
      category: voucher.category,
      name: name.trim(),
      isActive: true,
      _id: { $ne: req.params.id }
    });

    if (existing) {
      return res.status(400).json({
        message: "?´ë? ?±ë¡??ê¶Œì¢…ëª…ì…?ˆë‹¤."
      });
    }

    voucher.name = name.trim();
    voucher.lastModifiedBy = req.user._id;
    voucher.lastModifiedAt = new Date();

    await voucher.save();

    await voucher.populate("createdBy", "name email");
    await voucher.populate("lastModifiedBy", "name email");

    res.json({ success: true, voucher });
  } catch (error) {
    console.error("ê¶Œë©´ ?€???˜ì • ?¤ë¥˜:", error);
    res.status(500).json({ message: "ê¶Œë©´ ?€???˜ì • ?¤íŒ¨" });
  }
});

// ê¶Œë©´ ?€??ë¹„í™œ?±í™” (ê´€ë¦¬ì)
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const voucher = await VoucherType.findById(req.params.id);

    if (!voucher) {
      return res.status(404).json({ message: "ê¶Œë©´ ?€?…ì„ ì°¾ì„ ???†ìŠµ?ˆë‹¤." });
    }

    voucher.isActive = false;
    voucher.deactivatedBy = req.user._id;
    voucher.deactivatedAt = new Date();

    await voucher.save();

    res.json({ success: true, message: "ê¶Œë©´ ?€?…ì´ ë¹„í™œ?±í™”?˜ì—ˆ?µë‹ˆ??" });
  } catch (error) {
    console.error("ê¶Œë©´ ?€??ë¹„í™œ?±í™” ?¤ë¥˜:", error);
    res.status(500).json({ message: "ê¶Œë©´ ?€??ë¹„í™œ?±í™” ?¤íŒ¨" });
  }
});

// ê¶Œë©´ ?€???¬í™œ?±í™” (ê´€ë¦¬ì)
router.patch("/:id/reactivate", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const voucher = await VoucherType.findById(req.params.id);

    if (!voucher) {
      return res.status(404).json({ message: "ê¶Œë©´ ?€?…ì„ ì°¾ì„ ???†ìŠµ?ˆë‹¤." });
    }

    voucher.isActive = true;
    voucher.deactivatedBy = null;
    voucher.deactivatedAt = null;

    await voucher.save();

    res.json({ success: true, message: "ê¶Œë©´ ?€?…ì´ ?¬í™œ?±í™”?˜ì—ˆ?µë‹ˆ??" });
  } catch (error) {
    console.error("ê¶Œë©´ ?€???¬í™œ?±í™” ?¤ë¥˜:", error);
    res.status(500).json({ message: "ê¶Œë©´ ?€???¬í™œ?±í™” ?¤íŒ¨" });
  }
});

export default router;
