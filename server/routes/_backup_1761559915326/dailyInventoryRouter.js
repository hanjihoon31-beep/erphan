// server/routes/dailyInventoryRouter.js
import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import DailyInventory from "../models/DailyInventory.js";
import DailyInventoryTemplate from "../models/DailyInventoryTemplate.js";
import Store from "../models/Store.js";
import Product from "../models/Product.js";

const router = express.Router();

// ==================== ?¼ì¼ ?¬ê³  ?œí”Œë¦?ê´€ë¦?(ê´€ë¦¬ì?? ====================

// ë§¤ì¥ë³??¬ê³  ?œí”Œë¦?ì¡°íšŒ
router.get("/templates/:storeId", verifyToken, async (req, res) => {
  try {
    const templates = await DailyInventoryTemplate.find({
      store: req.params.storeId,
      isActive: true
    })
      .populate("product", "productName unit category storageType")
      .populate("createdBy", "name email")
      .sort({ displayOrder: 1, createdAt: 1 });

    res.json(templates);
  } catch (error) {
    console.error("?œí”Œë¦?ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?œí”Œë¦?ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ?¬ê³  ?œí”Œë¦??ì„± (ê´€ë¦¬ì ?„ìš©)
router.post("/templates", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { storeId, productId, displayOrder } = req.body;

    const existing = await DailyInventoryTemplate.findOne({
      store: storeId,
      product: productId
    });

    if (existing) {
      return res.status(400).json({ message: "?´ë? ?±ë¡???œí’ˆ?…ë‹ˆ??" });
    }

    const template = await DailyInventoryTemplate.create({
      store: storeId,
      product: productId,
      displayOrder: displayOrder || 0,
      createdBy: req.user._id
    });

    const populated = await DailyInventoryTemplate.findById(template._id)
      .populate("product", "productName unit category")
      .populate("store", "storeNumber storeName");

    res.status(201).json({ success: true, template: populated });
  } catch (error) {
    console.error("?œí”Œë¦??ì„± ?¤ë¥˜:", error);
    res.status(500).json({ message: "?œí”Œë¦??ì„± ?¤íŒ¨" });
  }
});

// ?¬ê³  ?œí”Œë¦??¼ê´„ ?ì„± (ê´€ë¦¬ì ?„ìš©)
router.post("/templates/bulk", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { storeId, productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "?œí’ˆ ëª©ë¡???„ìš”?©ë‹ˆ??" });
    }

    const templates = [];
    for (let i = 0; i < productIds.length; i++) {
      const existing = await DailyInventoryTemplate.findOne({
        store: storeId,
        product: productIds[i]
      });

      if (!existing) {
        templates.push({
          store: storeId,
          product: productIds[i],
          displayOrder: i,
          createdBy: req.user._id
        });
      }
    }

    if (templates.length > 0) {
      await DailyInventoryTemplate.insertMany(templates);
    }

    res.json({
      success: true,
      message: `${templates.length}ê°??œí”Œë¦¿ì´ ?ì„±?˜ì—ˆ?µë‹ˆ??`
    });
  } catch (error) {
    console.error("?œí”Œë¦??¼ê´„ ?ì„± ?¤ë¥˜:", error);
    res.status(500).json({ message: "?œí”Œë¦??¼ê´„ ?ì„± ?¤íŒ¨" });
  }
});

// ?¬ê³  ?œí”Œë¦??? œ
router.delete("/templates/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await DailyInventoryTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "?œí”Œë¦¿ì´ ?? œ?˜ì—ˆ?µë‹ˆ??" });
  } catch (error) {
    console.error("?œí”Œë¦??? œ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?œí”Œë¦??? œ ?¤íŒ¨" });
  }
});

// ==================== ?¼ì¼ ?¬ê³  ?ì„± (?ë™/?˜ë™) ====================

router.post("/generate", verifyToken, async (req, res) => {
  try {
    const { storeId, date } = req.body;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const existingCount = await DailyInventory.countDocuments({
      store: storeId,
      date: targetDate
    });

    if (existingCount > 0) {
      return res.status(400).json({ message: "?´ë? ?ì„±???¬ê³  ?œì‹?…ë‹ˆ??" });
    }

    const templates = await DailyInventoryTemplate.find({
      store: storeId,
      isActive: true
    }).sort({ displayOrder: 1 });

    if (templates.length === 0) {
      return res.status(400).json({ message: "?¬ê³  ?œí”Œë¦¿ì´ ?¤ì •?˜ì? ?Šì•˜?µë‹ˆ??" });
    }

    const previousDate = new Date(targetDate);
    previousDate.setDate(previousDate.getDate() - 1);

    const previousInventories = await DailyInventory.find({
      store: storeId,
      date: previousDate
    });

    const previousStockMap = {};
    previousInventories.forEach(inv => {
      previousStockMap[inv.product.toString()] = inv.closingStock || 0;
    });

    const dailyInventories = templates.map(template => ({
      store: storeId,
      product: template.product,
      date: targetDate,
      previousClosingStock: previousStockMap[template.product.toString()] || 0,
      status: "?€ê¸?
    }));

    await DailyInventory.insertMany(dailyInventories);

    res.json({
      success: true,
      message: `${dailyInventories.length}ê°??¬ê³  ??ª©???ì„±?˜ì—ˆ?µë‹ˆ??`,
      count: dailyInventories.length
    });
  } catch (error) {
    console.error("?¬ê³  ?œì‹ ?ì„± ?¤ë¥˜:", error);
    res.status(500).json({ message: "?¬ê³  ?œì‹ ?ì„± ?¤íŒ¨" });
  }
});

// ==================== ?¼ì¼ ?¬ê³  ì¡°íšŒ ====================

router.get("/:storeId/:date", verifyToken, async (req, res) => {
  try {
    const { storeId, date } = req.params;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const dailyInventories = await DailyInventory.find({
      store: storeId,
      date: targetDate
    })
      .populate("product", "productName unit category storageType")
      .populate("submittedBy", "name email")
      .populate("approvedBy", "name email")
      .sort({ createdAt: 1 });

    res.json(dailyInventories);
  } catch (error) {
    console.error("?¼ì¼ ?¬ê³  ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?¼ì¼ ?¬ê³  ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ?¹ì¸ ?€ê¸?ì¤‘ì¸ ?¬ê³  ëª©ë¡ ì¡°íšŒ (ê´€ë¦¬ì??
router.get("/pending/all", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const pendingInventories = await DailyInventory.find({
      status: "?¹ì¸?”ì²­"
    })
      .populate("store", "storeNumber storeName")
      .populate("product", "productName unit")
      .populate("submittedBy", "name email")
      .sort({ date: -1, submittedAt: -1 });

    res.json(pendingInventories);
  } catch (error) {
    console.error("?€ê¸?ëª©ë¡ ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?€ê¸?ëª©ë¡ ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ==================== ?¼ì¼ ?¬ê³  ?˜ì • ====================

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const {
      morningStock,
      closingStock,
      inboundQuantity,
      outboundQuantity,
      discrepancyReason,
      notes
    } = req.body;

    const dailyInv = await DailyInventory.findById(req.params.id);

    if (!dailyInv) {
      return res.status(404).json({ message: "?¬ê³  ??ª©??ì°¾ì„ ???†ìŠµ?ˆë‹¤." });
    }

    let discrepancy = 0;
    if (morningStock !== undefined && dailyInv.previousClosingStock !== undefined) {
      discrepancy = morningStock - dailyInv.previousClosingStock;
    }

    dailyInv.morningStock = morningStock ?? dailyInv.morningStock;
    dailyInv.closingStock = closingStock ?? dailyInv.closingStock;
    dailyInv.inboundQuantity = inboundQuantity ?? dailyInv.inboundQuantity;
    dailyInv.outboundQuantity = outboundQuantity ?? dailyInv.outboundQuantity;
    dailyInv.discrepancy = discrepancy;
    dailyInv.discrepancyReason = discrepancyReason || dailyInv.discrepancyReason;
    dailyInv.notes = notes || dailyInv.notes;
    dailyInv.updatedAt = new Date();

    if (dailyInv.status === "?€ê¸?) dailyInv.status = "?‘ì„±ì¤?;

    await dailyInv.save();

    const updated = await DailyInventory.findById(dailyInv._id)
      .populate("product", "productName unit")
      .populate("store", "storeNumber storeName");

    res.json({ success: true, dailyInventory: updated });
  } catch (error) {
    console.error("?¬ê³  ?˜ì • ?¤ë¥˜:", error);
    res.status(500).json({ message: "?¬ê³  ?˜ì • ?¤íŒ¨" });
  }
});

// ==================== ?¼ê´„ ?¹ì¸ ?”ì²­ ====================

router.post("/submit-all/:storeId/:date", verifyToken, async (req, res) => {
  try {
    const { storeId, date } = req.params;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const inventories = await DailyInventory.find({
      store: storeId,
      date: targetDate,
      status: { $in: ["?€ê¸?, "?‘ì„±ì¤?] }
    });

    const invalidItems = inventories.filter(inv =>
      Math.abs(inv.discrepancy) > 0 && !inv.discrepancyReason
    );

    if (invalidItems.length > 0) {
      return res.status(400).json({
        message: `${invalidItems.length}ê°???ª©???¬ê³  ì°¨ì´ ?¬ìœ ê°€ ?„ìš”?©ë‹ˆ??`
      });
    }

    await DailyInventory.updateMany(
      {
        store: storeId,
        date: targetDate,
        status: { $in: ["?€ê¸?, "?‘ì„±ì¤?] }
      },
      {
        status: "?¹ì¸?”ì²­",
        submittedBy: req.user._id,
        submittedAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `${inventories.length}ê°???ª©???¹ì¸ ?”ì²­?˜ì—ˆ?µë‹ˆ??`
    });
  } catch (error) {
    console.error("?¼ê´„ ?¹ì¸ ?”ì²­ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?¼ê´„ ?¹ì¸ ?”ì²­ ?¤íŒ¨" });
  }
});

// ==================== ?¼ê´„ ?¹ì¸/ê±°ë? ====================

router.put("/:id/approve", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const dailyInv = await DailyInventory.findById(req.params.id);
    if (!dailyInv) return res.status(404).json({ message: "?¬ê³  ??ª©??ì°¾ì„ ???†ìŠµ?ˆë‹¤." });
    if (dailyInv.status !== "?¹ì¸?”ì²­") return res.status(400).json({ message: "?¹ì¸ ?”ì²­ ?íƒœê°€ ?„ë‹™?ˆë‹¤." });

    dailyInv.status = "?¹ì¸";
    dailyInv.approvedBy = req.user._id;
    dailyInv.approvedAt = new Date();
    await dailyInv.save();

    res.json({ success: true, message: "?¬ê³ ê°€ ?¹ì¸?˜ì—ˆ?µë‹ˆ??" });
  } catch (error) {
    console.error("?¬ê³  ?¹ì¸ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?¬ê³  ?¹ì¸ ?¤íŒ¨" });
  }
});

router.put("/:id/reject", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) return res.status(400).json({ message: "ê±°ë? ?¬ìœ ë¥??…ë ¥?´ì£¼?¸ìš”." });

    const dailyInv = await DailyInventory.findById(req.params.id);
    if (!dailyInv) return res.status(404).json({ message: "?¬ê³  ??ª©??ì°¾ì„ ???†ìŠµ?ˆë‹¤." });
    if (dailyInv.status !== "?¹ì¸?”ì²­") return res.status(400).json({ message: "?¹ì¸ ?”ì²­ ?íƒœê°€ ?„ë‹™?ˆë‹¤." });

    dailyInv.status = "ê±°ë?";
    dailyInv.rejectionReason = rejectionReason;
    dailyInv.approvedBy = req.user._id;
    dailyInv.approvedAt = new Date();
    await dailyInv.save();

    res.json({ success: true, message: "?¬ê³ ê°€ ê±°ë??˜ì—ˆ?µë‹ˆ??" });
  } catch (error) {
    console.error("?¬ê³  ê±°ë? ?¤ë¥˜:", error);
    res.status(500).json({ message: "?¬ê³  ê±°ë? ?¤íŒ¨" });
  }
});

router.post("/approve-all/:storeId/:date", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { storeId, date } = req.params;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const result = await DailyInventory.updateMany(
      {
        store: storeId,
        date: targetDate,
        status: "?¹ì¸?”ì²­"
      },
      {
        status: "?¹ì¸",
        approvedBy: req.user._id,
        approvedAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount}ê°???ª©???¹ì¸?˜ì—ˆ?µë‹ˆ??`
    });
  } catch (error) {
    console.error("?¼ê´„ ?¹ì¸ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?¼ê´„ ?¹ì¸ ?¤íŒ¨" });
  }
});

export default router;
