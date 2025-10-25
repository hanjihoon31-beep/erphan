// server/routes/storeRoutes.js
const express = require("express");
const Store = require("../models/Store");
const Warehouse = require("../models/Warehouse");

const router = express.Router();

// ========== 매장 관리 ==========

// ✅ 모든 매장 조회
router.get("/stores", async (req, res) => {
  try {
    const stores = await Store.find().sort({ createdAt: -1 });
    res.json(stores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "매장 목록 조회 중 오류 발생" });
  }
});

// ✅ 활성화된 매장만 조회
router.get("/stores/active", async (req, res) => {
  try {
    const stores = await Store.find({ isActive: true }).sort({ storeId: 1 });
    res.json(stores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "매장 목록 조회 중 오류 발생" });
  }
});

// ✅ 매장 추가
router.post("/stores", async (req, res) => {
  try {
    const { storeId, name, address, phone, manager } = req.body;

    if (!storeId || !name) {
      return res.status(400).json({ message: "매장 코드와 이름은 필수입니다." });
    }

    const existing = await Store.findOne({ storeId });
    if (existing) {
      return res.status(400).json({ message: "이미 존재하는 매장 코드입니다." });
    }

    const store = await Store.create({
      storeId,
      name,
      address,
      phone,
      manager,
    });

    res.status(201).json({ message: "매장이 추가되었습니다.", store });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "매장 추가 중 오류 발생" });
  }
});

// ✅ 매장 수정
router.put("/stores/:id", async (req, res) => {
  try {
    const { name, address, phone, manager, isActive } = req.body;

    const store = await Store.findByIdAndUpdate(
      req.params.id,
      { name, address, phone, manager, isActive, updatedAt: Date.now() },
      { new: true }
    );

    if (!store) {
      return res.status(404).json({ message: "매장을 찾을 수 없습니다." });
    }

    res.json({ message: "매장 정보가 수정되었습니다.", store });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "매장 수정 중 오류 발생" });
  }
});

// ✅ 매장 삭제 (실제로는 비활성화)
router.delete("/stores/:id", async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!store) {
      return res.status(404).json({ message: "매장을 찾을 수 없습니다." });
    }

    res.json({ message: "매장이 비활성화되었습니다.", store });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "매장 삭제 중 오류 발생" });
  }
});

// ========== 창고 관리 ==========

// ✅ 모든 창고 조회
router.get("/warehouses", async (req, res) => {
  try {
    const warehouses = await Warehouse.find().sort({ createdAt: -1 });
    res.json(warehouses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "창고 목록 조회 중 오류 발생" });
  }
});

// ✅ 활성화된 창고만 조회
router.get("/warehouses/active", async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ isActive: true }).sort({ warehouseId: 1 });
    res.json(warehouses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "창고 목록 조회 중 오류 발생" });
  }
});

// ✅ 창고 추가
router.post("/warehouses", async (req, res) => {
  try {
    const { warehouseId, name, address, phone, manager } = req.body;

    if (!warehouseId || !name) {
      return res.status(400).json({ message: "창고 코드와 이름은 필수입니다." });
    }

    const existing = await Warehouse.findOne({ warehouseId });
    if (existing) {
      return res.status(400).json({ message: "이미 존재하는 창고 코드입니다." });
    }

    const warehouse = await Warehouse.create({
      warehouseId,
      name,
      address,
      phone,
      manager,
    });

    res.status(201).json({ message: "창고가 추가되었습니다.", warehouse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "창고 추가 중 오류 발생" });
  }
});

// ✅ 창고 수정
router.put("/warehouses/:id", async (req, res) => {
  try {
    const { name, address, phone, manager, isActive } = req.body;

    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      { name, address, phone, manager, isActive, updatedAt: Date.now() },
      { new: true }
    );

    if (!warehouse) {
      return res.status(404).json({ message: "창고를 찾을 수 없습니다." });
    }

    res.json({ message: "창고 정보가 수정되었습니다.", warehouse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "창고 수정 중 오류 발생" });
  }
});

// ✅ 창고 삭제 (실제로는 비활성화)
router.delete("/warehouses/:id", async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!warehouse) {
      return res.status(404).json({ message: "창고를 찾을 수 없습니다." });
    }

    res.json({ message: "창고가 비활성화되었습니다.", warehouse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "창고 삭제 중 오류 발생" });
  }
});

module.exports = router;
