// server/routes/dailyInventoryRouter.js
// ESM + .js 확장자 + 잘려있던 submit-all 보정 완료

import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import DailyInventory from "../models/DailyInventory.js";
import DailyInventoryTemplate from "../models/DailyInventoryTemplate.js";
import Store from "../models/Store.js";
import Product from "../models/Product.js";

const router = express.Router();

/** 공통: 날짜를 00:00:00 로 normalize */
function normalizeDate(d) {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
}

/* =========================
 *  템플릿 (Template)
 * =========================*/

// 매장별 재고 템플릿 조회
router.get("/templates/:storeId", verifyToken, async (req, res) => {
  try {
    const templates = await DailyInventoryTemplate.find({
      store: req.params.storeId,
      isActive: true,
    })
      .populate("product", "productName unit category storageType")
      .populate("createdBy", "name email")
      .sort({ displayOrder: 1, createdAt: 1 });

    res.json(templates);
  } catch (error) {
    console.error("템플릿 조회 오류:", error);
    res.status(500).json({ message: "템플릿 조회 실패" });
  }
});

// 재고 템플릿 생성 (관리자 전용)
router.post("/templates", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { storeId, productId, displayOrder } = req.body;

    const dup = await DailyInventoryTemplate.findOne({
      store: storeId,
      product: productId,
    });
    if (dup) return res.status(400).json({ message: "이미 등록된 제품입니다." });

    const created = await DailyInventoryTemplate.create({
      store: storeId,
      product: productId,
      displayOrder: displayOrder || 0,
      createdBy: req.user._id,
    });

    const populated = await DailyInventoryTemplate.findById(created._id)
      .populate("product", "productName unit category")
      .populate("store", "storeNumber storeName");

    res.status(201).json({ success: true, template: populated });
  } catch (error) {
    console.error("템플릿 생성 오류:", error);
    res.status(500).json({ message: "템플릿 생성 실패" });
  }
});

// 재고 템플릿 일괄 생성 (관리자 전용)
router.post("/templates/bulk", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { storeId, productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "제품 목록이 필요합니다." });
    }

    const docs = [];
    for (let i = 0; i < productIds.length; i++) {
      const exists = await DailyInventoryTemplate.findOne({
        store: storeId,
        product: productIds[i],
      });
      if (!exists) {
        docs.push({
          store: storeId,
          product: productIds[i],
          displayOrder: i,
          createdBy: req.user._id,
        });
      }
    }
    if (docs.length) await DailyInventoryTemplate.insertMany(docs);

    res.json({ success: true, message: `${docs.length}개 템플릿이 생성되었습니다.` });
  } catch (error) {
    console.error("템플릿 일괄 생성 오류:", error);
    res.status(500).json({ message: "템플릿 일괄 생성 실패" });
  }
});

// 재고 템플릿 삭제 (관리자 전용)
router.delete("/templates/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await DailyInventoryTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "템플릿이 삭제되었습니다." });
  } catch (error) {
    console.error("템플릿 삭제 오류:", error);
    res.status(500).json({ message: "템플릿 삭제 실패" });
  }
});

/* =========================
 *  일일 재고 생성/조회
 * =========================*/

// 특정 날짜의 일일 재고 서식 생성
router.post("/generate", verifyToken, async (req, res) => {
  try {
    const { storeId, date } = req.body;
    const targetDate = normalizeDate(date);

    // 중복 생성 방지
    const exists = await DailyInventory.countDocuments({ store: storeId, date: targetDate });
    if (exists > 0) return res.status(400).json({ message: "이미 생성된 재고 서식입니다." });

    const templates = await DailyInventoryTemplate.find({ store: storeId, isActive: true })
      .sort({ displayOrder: 1 });

    if (templates.length === 0) {
      return res.status(400).json({ message: "재고 템플릿이 설정되지 않았습니다." });
    }

    // 전날 마감 재고
    const prevDate = normalizeDate(targetDate);
    prevDate.setDate(prevDate.getDate() - 1);

    const prevInventories = await DailyInventory.find({ store: storeId, date: prevDate });
    const prevMap = {};
    prevInventories.forEach(inv => {
      prevMap[inv.product.toString()] = inv.closingStock || 0;
    });

    const items = templates.map(t => ({
      store: storeId,
      product: t.product,
      date: targetDate,
      previousClosingStock: prevMap[t.product.toString()] || 0,
      status: "대기",
    }));

    await DailyInventory.insertMany(items);
    res.json({ success: true, message: `${items.length}개 재고 항목이 생성되었습니다.`, count: items.length });
  } catch (error) {
    console.error("재고 서식 생성 오류:", error);
    res.status(500).json({ message: "재고 서식 생성 실패" });
  }
});

// 특정 매장/날짜의 일일 재고 조회
router.get("/:storeId/:date", verifyToken, async (req, res) => {
  try {
    const { storeId, date } = req.params;
    const targetDate = normalizeDate(date);

    const list = await DailyInventory.find({
      store: storeId,
      date: targetDate,
    })
      .populate("product", "productName unit category storageType")
      .populate("submittedBy", "name email")
      .populate("approvedBy", "name email")
      .sort({ createdAt: 1 });

    res.json(list);
  } catch (error) {
    console.error("일일 재고 조회 오류:", error);
    res.status(500).json({ message: "일일 재고 조회 실패" });
  }
});

// (관리자) 승인 대기 전체 조회
router.get("/pending/all", verifyToken, verifyAdmin, async (_req, res) => {
  try {
    const list = await DailyInventory.find({ status: "승인요청" })
      .populate("store", "storeNumber storeName")
      .populate("product", "productName unit")
      .populate("submittedBy", "name email")
      .sort({ date: -1, submittedAt: -1 });

    res.json(list);
  } catch (error) {
    console.error("대기 목록 조회 오류:", error);
    res.status(500).json({ message: "대기 목록 조회 실패" });
  }
});

/* =========================
 *  일일 재고 입력/제출
 * =========================*/

// 항목 수정 (근무자)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const {
      morningStock,
      closingStock,
      inboundQuantity,
      outboundQuantity,
      discrepancyReason,
      notes,
    } = req.body;

    const daily = await DailyInventory.findById(req.params.id);
    if (!daily) return res.status(404).json({ message: "재고 항목을 찾을 수 없습니다." });

    // 재고 차이 계산
    let discrepancy = daily.discrepancy || 0;
    if (morningStock !== undefined && daily.previousClosingStock !== undefined) {
      discrepancy = Number(morningStock) - Number(daily.previousClosingStock);
    }

    daily.morningStock = morningStock ?? daily.morningStock;
    daily.closingStock = closingStock ?? daily.closingStock;
    daily.inboundQuantity = inboundQuantity ?? daily.inboundQuantity;
    daily.outboundQuantity = outboundQuantity ?? daily.outboundQuantity;
    daily.discrepancy = discrepancy;
    daily.discrepancyReason = discrepancyReason ?? daily.discrepancyReason;
    daily.notes = notes ?? daily.notes;
    daily.updatedAt = new Date();

    if (daily.status === "대기") daily.status = "작성중";

    await daily.save();

    const updated = await DailyInventory.findById(daily._id)
      .populate("product", "productName unit")
      .populate("store", "storeNumber storeName");

    res.json({ success: true, dailyInventory: updated });
  } catch (error) {
    console.error("재고 수정 오류:", error);
    res.status(500).json({ message: "재고 수정 실패" });
  }
});

// 항목 제출 (근무자)
router.put("/:id/submit", verifyToken, async (req, res) => {
  try {
    const daily = await DailyInventory.findById(req.params.id);
    if (!daily) return res.status(404).json({ message: "재고 항목을 찾을 수 없습니다." });

    if (Math.abs(daily.discrepancy || 0) > 0 && !daily.discrepancyReason) {
      return res.status(400).json({ message: "재고 차이 사유를 입력해주세요." });
    }

    daily.status = "승인요청";
    daily.submittedBy = req.user._id;
    daily.submittedAt = new Date();
    await daily.save();

    res.json({ success: true, message: "승인 요청이 제출되었습니다." });
  } catch (error) {
    console.error("승인 요청 오류:", error);
    res.status(500).json({ message: "승인 요청 실패" });
  }
});

// (보정) 일괄 제출 (근무자)
router.post("/submit-all/:storeId/:date", verifyToken, async (req, res) => {
  try {
    const { storeId, date } = req.params;
    const targetDate = normalizeDate(date);

    const inventories = await DailyInventory.find({
      store: storeId,
      date: targetDate,
      status: { $in: ["대기", "작성중"] },
    });

    const invalid = inventories.filter(
      inv => Math.abs(inv.discrepancy || 0) > 0 && !inv.discrepancyReason
    );
    if (invalid.length > 0) {
      return res.status(400).json({
        message: `${invalid.length}개 항목에 재고 차이 사유가 필요합니다.`,
      });
    }

    await DailyInventory.updateMany(
      { store: storeId, date: targetDate, status: { $in: ["대기", "작성중"] } },
      { status: "승인요청", submittedBy: req.user._id, submittedAt: new Date() }
    );

    res.json({
      success: true,
      message: `${inventories.length}개 항목이 승인 요청되었습니다.`,
    });
  } catch (error) {
    console.error("일괄 승인 요청 오류:", error);
    res.status(500).json({ message: "일괄 승인 요청 실패" });
  }
});

/* =========================
 *  승인 / 거부 (관리자)
 * =========================*/

// 승인 (관리자)
router.put("/:id/approve", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const daily = await DailyInventory.findById(req.params.id);
    if (!daily) return res.status(404).json({ message: "재고 항목을 찾을 수 없습니다." });
    if (daily.status !== "승인요청") {
      return res.status(400).json({ message: "승인 요청 상태가 아닙니다." });
    }

    daily.status = "승인";
    daily.approvedBy = req.user._id;
    daily.approvedAt = new Date();
    await daily.save();

    res.json({ success: true, message: "재고가 승인되었습니다." });
  } catch (error) {
    console.error("재고 승인 오류:", error);
    res.status(500).json({ message: "재고 승인 실패" });
  }
});

// 거부 (관리자)
router.put("/:id/reject", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      return res.status(400).json({ message: "거부 사유를 입력해주세요." });
    }

    const daily = await DailyInventory.findById(req.params.id);
    if (!daily) return res.status(404).json({ message: "재고 항목을 찾을 수 없습니다." });
    if (daily.status !== "승인요청") {
      return res.status(400).json({ message: "승인 요청 상태가 아닙니다." });
    }

    daily.status = "거부";
    daily.rejectionReason = rejectionReason;
    daily.approvedBy = req.user._id;
    daily.approvedAt = new Date();
    await daily.save();

    res.json({ success: true, message: "재고가 거부되었습니다." });
  } catch (error) {
    console.error("재고 거부 오류:", error);
    res.status(500).json({ message: "재고 거부 실패" });
  }
});

// 일괄 승인 (관리자)
router.post("/approve-all/:storeId/:date", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { storeId, date } = req.params;
    const targetDate = normalizeDate(date);

    const result = await DailyInventory.updateMany(
      { store: storeId, date: targetDate, status: "승인요청" },
      { status: "승인", approvedBy: req.user._id, approvedAt: new Date() }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount}개 항목이 승인되었습니다.`,
    });
  } catch (error) {
    console.error("일괄 승인 오류:", error);
    res.status(500).json({ message: "일괄 승인 실패" });
  }
});

export default router;
