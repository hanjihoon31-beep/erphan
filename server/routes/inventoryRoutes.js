// server/routes/inventoryRoutes.js
const express = require("express");
const Inventory = require("../models/Inventory");

const router = express.Router();

// ✅ 재고 목록 조회
router.get("/", async (req, res) => {
  try {
    const { storeId, warehouseId, category, lowStock } = req.query;

    let query = {};

    if (storeId) {
      query.storeId = storeId;
    }

    if (warehouseId) {
      query.warehouseId = warehouseId;
    }

    if (category) {
      query.category = category;
    }

    const inventory = await Inventory.find(query).sort({ lastUpdated: -1 });

    // 재고 부족 필터링
    if (lowStock === "true") {
      const lowStockItems = inventory.filter((item) => item.quantity <= item.minQuantity);
      return res.json(lowStockItems);
    }

    res.json(inventory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "재고 목록 조회 중 오류 발생" });
  }
});

// ✅ 재고 추가
router.post("/", async (req, res) => {
  try {
    const {
      itemId,
      itemName,
      category,
      unit,
      storeId,
      warehouseId,
      locationName,
      quantity,
      minQuantity,
      unitPrice,
      updatedBy,
      notes,
    } = req.body;

    if (!itemId || !itemName || !category || !unit) {
      return res.status(400).json({ message: "필수 정보를 입력해주세요." });
    }

    if (!storeId && !warehouseId) {
      return res.status(400).json({ message: "매장 또는 창고를 선택해주세요." });
    }

    const existing = await Inventory.findOne({ itemId });
    if (existing) {
      return res.status(400).json({ message: "이미 존재하는 품목 코드입니다." });
    }

    const inventory = await Inventory.create({
      itemId,
      itemName,
      category,
      unit,
      storeId,
      warehouseId,
      locationName,
      quantity: quantity || 0,
      minQuantity: minQuantity || 0,
      unitPrice,
      updatedBy,
      notes,
    });

    res.status(201).json({ message: "재고가 추가되었습니다.", inventory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "재고 추가 중 오류 발생" });
  }
});

// ✅ 재고 수정
router.put("/:id", async (req, res) => {
  try {
    const {
      itemName,
      category,
      unit,
      quantity,
      minQuantity,
      unitPrice,
      updatedBy,
      notes,
    } = req.body;

    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      {
        itemName,
        category,
        unit,
        quantity,
        minQuantity,
        unitPrice,
        updatedBy,
        notes,
        lastUpdated: Date.now(),
      },
      { new: true }
    );

    if (!inventory) {
      return res.status(404).json({ message: "재고를 찾을 수 없습니다." });
    }

    res.json({ message: "재고가 수정되었습니다.", inventory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "재고 수정 중 오류 발생" });
  }
});

// ✅ 재고 수량 조정 (입출고)
router.patch("/:id/adjust", async (req, res) => {
  try {
    const { adjustment, updatedBy, notes } = req.body;

    if (adjustment === undefined || adjustment === 0) {
      return res.status(400).json({ message: "조정 수량을 입력해주세요." });
    }

    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: "재고를 찾을 수 없습니다." });
    }

    const newQuantity = inventory.quantity + adjustment;
    if (newQuantity < 0) {
      return res.status(400).json({ message: "재고가 부족합니다." });
    }

    inventory.quantity = newQuantity;
    inventory.updatedBy = updatedBy;
    inventory.notes = notes || inventory.notes;
    inventory.lastUpdated = Date.now();

    await inventory.save();

    res.json({
      message: `재고가 ${adjustment > 0 ? "입고" : "출고"}되었습니다.`,
      inventory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "재고 조정 중 오류 발생" });
  }
});

// ✅ 재고 삭제
router.delete("/:id", async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);

    if (!inventory) {
      return res.status(404).json({ message: "재고를 찾을 수 없습니다." });
    }

    res.json({ message: "재고가 삭제되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "재고 삭제 중 오류 발생" });
  }
});

// ✅ 재고 현황 요약
router.get("/summary", async (req, res) => {
  try {
    const { storeId, warehouseId } = req.query;

    let query = {};
    if (storeId) query.storeId = storeId;
    if (warehouseId) query.warehouseId = warehouseId;

    const inventory = await Inventory.find(query);

    const summary = {
      totalItems: inventory.length,
      totalValue: inventory.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0),
      lowStockItems: inventory.filter((item) => item.quantity <= item.minQuantity).length,
      categories: {},
    };

    // 카테고리별 집계
    inventory.forEach((item) => {
      if (!summary.categories[item.category]) {
        summary.categories[item.category] = {
          itemCount: 0,
          totalQuantity: 0,
          totalValue: 0,
        };
      }
      summary.categories[item.category].itemCount++;
      summary.categories[item.category].totalQuantity += item.quantity;
      summary.categories[item.category].totalValue += item.quantity * (item.unitPrice || 0);
    });

    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "재고 현황 요약 조회 중 오류 발생" });
  }
});

module.exports = router;
