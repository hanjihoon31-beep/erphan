// server/routes/inventoryRouter.js
import express from 'express';
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
import Store from '../models/Store';
import Warehouse from '../models/Warehouse';
import Product from '../models/Product';
import Inventory from '../models/Inventory.js';
import MinimumStock from '../models/MinimumStock';
import StockTransfer from '../models/StockTransfer';

const router = express.Router();

// ==================== 매장 관리 ====================

// 전체 매장 목록 조회
router.get("/stores", verifyToken, async (req, res) => {
  try {
    const stores = await Store.find().populate("manager", "name email").sort({ storeNumber: 1 });
    res.json(stores);
  } catch (error) {
    console.error("매장 목록 조회 오류:", error);
    res.status(500).json({ message: "매장 목록 조회 실패" });
  }
});

// 매장 생성 (관리자 전용)
router.post("/stores", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { storeNumber, storeName, location, manager, phone } = req.body;

    const existingStore = await Store.findOne({ storeNumber });
    if (existingStore) {
      return res.status(400).json({ message: "이미 존재하는 매장 번호입니다." });
    }

    const newStore = await Store.create({
      storeNumber,
      storeName,
      location,
      manager,
      phone,
    });

    res.status(201).json({ success: true, store: newStore });
  } catch (error) {
    console.error("매장 생성 오류:", error);
    res.status(500).json({ message: "매장 생성 실패" });
  }
});

// 매장 수정
router.put("/stores/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { storeName, location, manager, phone, isActive } = req.body;
    const updatedStore = await Store.findByIdAndUpdate(
      req.params.id,
      { storeName, location, manager, phone, isActive },
      { new: true }
    );

    if (!updatedStore) {
      return res.status(404).json({ message: "매장을 찾을 수 없습니다." });
    }

    res.json({ success: true, store: updatedStore });
  } catch (error) {
    console.error("매장 수정 오류:", error);
    res.status(500).json({ message: "매장 수정 실패" });
  }
});

// 매장 삭제 (관리자 전용)
router.delete("/stores/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const storeId = req.params.id;

    // 해당 매장과 관련된 데이터 확인
    const relatedInventory = await Inventory.countDocuments({ store: storeId });

    if (relatedInventory > 0) {
      return res.status(400).json({
        message: `이 매장에는 ${relatedInventory}개의 재고 데이터가 있습니다. 먼저 재고를 처리해주세요.`
      });
    }

    const deletedStore = await Store.findByIdAndDelete(storeId);

    if (!deletedStore) {
      return res.status(404).json({ message: "매장을 찾을 수 없습니다." });
    }

    res.json({ success: true, message: "매장이 삭제되었습니다." });
  } catch (error) {
    console.error("매장 삭제 오류:", error);
    res.status(500).json({ message: "매장 삭제 실패" });
  }
});

// ==================== 창고 관리 ====================

// 전체 창고 목록 조회
router.get("/warehouses", verifyToken, async (req, res) => {
  try {
    const warehouses = await Warehouse.find().sort({ warehouseName: 1 });
    res.json(warehouses);
  } catch (error) {
    console.error("창고 목록 조회 오류:", error);
    res.status(500).json({ message: "창고 목록 조회 실패" });
  }
});

// 창고 생성 (관리자 전용)
router.post("/warehouses", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { warehouseName, warehouseType, location, capacity } = req.body;

    const existingWarehouse = await Warehouse.findOne({ warehouseName });
    if (existingWarehouse) {
      return res.status(400).json({ message: "이미 존재하는 창고입니다." });
    }

    const newWarehouse = await Warehouse.create({
      warehouseName,
      warehouseType,
      location,
      capacity,
    });

    res.status(201).json({ success: true, warehouse: newWarehouse });
  } catch (error) {
    console.error("창고 생성 오류:", error);
    res.status(500).json({ message: "창고 생성 실패" });
  }
});

// ==================== 제품 관리 ====================

// 전체 제품 목록 조회
router.get("/products", verifyToken, async (req, res) => {
  try {
    const { search, category, storageType } = req.query;

    let query = { isActive: true };

    if (search) {
      query.productName = { $regex: search, $options: "i" };
    }
    if (category) {
      query.category = category;
    }
    if (storageType) {
      query.storageType = storageType;
    }

    const products = await Product.find(query).sort({ productName: 1 });
    res.json(products);
  } catch (error) {
    console.error("제품 목록 조회 오류:", error);
    res.status(500).json({ message: "제품 목록 조회 실패" });
  }
});

// 제품 생성 (관리자 전용)
router.post("/products", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { productCode, productName, category, unit, storageType, description } = req.body;

    if (!productName) {
      return res.status(400).json({ message: "제품명은 필수입니다." });
    }

    const newProduct = await Product.create({
      productCode,
      productName,
      category,
      unit,
      storageType,
      description,
    });

    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.error("제품 생성 오류:", error);
    res.status(500).json({ message: "제품 생성 실패" });
  }
});

// 제품 수정
router.put("/products/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "제품을 찾을 수 없습니다." });
    }

    res.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("제품 수정 오류:", error);
    res.status(500).json({ message: "제품 수정 실패" });
  }
});

// ==================== 재고 조회 ====================

// 전체 재고 현황 조회
router.get("/stock", verifyToken, async (req, res) => {
  try {
    const { location, productId, lowStock } = req.query;

    let query = {};

    if (productId) {
      query.product = productId;
    }

    const inventory = await Inventory.find(query)
      .populate("product", "productName category unit storageType")
      .populate("warehouse", "warehouseName warehouseType")
      .populate("store", "storeNumber storeName")
      .populate("lastUpdatedBy", "name email")
      .sort({ lastUpdatedAt: -1 });

    // 최소재고 미달 필터
    let result = inventory;
    if (lowStock === "true") {
      result = inventory.filter(item => item.quantity <= item.minimumStock);
    }

    res.json(result);
  } catch (error) {
    console.error("재고 조회 오류:", error);
    res.status(500).json({ message: "재고 조회 실패" });
  }
});

// 특정 제품의 위치별 재고 조회
router.get("/stock/product/:productId", verifyToken, async (req, res) => {
  try {
    const inventory = await Inventory.find({ product: req.params.productId })
      .populate("warehouse", "warehouseName warehouseType")
      .populate("store", "storeNumber storeName");

    res.json(inventory);
  } catch (error) {
    console.error("제품별 재고 조회 오류:", error);
    res.status(500).json({ message: "재고 조회 실패" });
  }
});

// ==================== 재고 이동 요청 ====================

// 재고 이동 요청 생성
router.post("/transfer", verifyToken, async (req, res) => {
  try {
    const {
      productId,
      fromWarehouseId,
      fromStoreId,
      toWarehouseId,
      toStoreId,
      quantity,
      reason,
      image,
    } = req.body;

    // 유효성 검사
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "제품과 수량을 확인해주세요." });
    }

    if ((!fromWarehouseId && !fromStoreId) || (!toWarehouseId && !toStoreId)) {
      return res.status(400).json({ message: "출발지와 목적지를 지정해주세요." });
    }

    // 출발지 재고 확인
    const fromQuery = {};
    if (fromWarehouseId) fromQuery.warehouse = fromWarehouseId;
    if (fromStoreId) fromQuery.store = fromStoreId;
    fromQuery.product = productId;

    const fromInventory = await Inventory.findOne(fromQuery);

    if (!fromInventory || fromInventory.quantity < quantity) {
      return res.status(400).json({ message: "출발지의 재고가 부족합니다." });
    }

    // 관리자는 자동 승인, 일반 사용자는 대기 상태
    const isAdmin = req.user.role === "admin" || req.user.role === "superadmin";

    const transfer = await StockTransfer.create({
      product: productId,
      fromWarehouse: fromWarehouseId,
      fromStore: fromStoreId,
      toWarehouse: toWarehouseId,
      toStore: toStoreId,
      quantity,
      reason,
      image,
      requestedBy: req.user._id,
      status: isAdmin ? "승인" : "대기",
      approvedBy: isAdmin ? req.user._id : null,
      approvedAt: isAdmin ? new Date() : null,
    });

    // 관리자의 경우 즉시 재고 이동 처리
    if (isAdmin) {
      await processStockTransfer(transfer);
    }

    const populatedTransfer = await StockTransfer.findById(transfer._id)
      .populate("product", "productName unit")
      .populate("fromWarehouse", "warehouseName")
      .populate("fromStore", "storeNumber storeName")
      .populate("toWarehouse", "warehouseName")
      .populate("toStore", "storeNumber storeName")
      .populate("requestedBy", "name email");

    res.status(201).json({
      success: true,
      transfer: populatedTransfer,
      message: isAdmin ? "재고 이동이 완료되었습니다." : "이동 요청이 등록되었습니다."
    });
  } catch (error) {
    console.error("재고 이동 요청 오류:", error);
    res.status(500).json({ message: "재고 이동 요청 실패" });
  }
});

// 재고 이동 요청 목록 조회
router.get("/transfers", verifyToken, async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    }

    const transfers = await StockTransfer.find(query)
      .populate("product", "productName unit")
      .populate("fromWarehouse", "warehouseName")
      .populate("fromStore", "storeNumber storeName")
      .populate("toWarehouse", "warehouseName")
      .populate("toStore", "storeNumber storeName")
      .populate("requestedBy", "name email")
      .populate("approvedBy", "name email")
      .sort({ requestedAt: -1 });

    res.json(transfers);
  } catch (error) {
    console.error("이동 목록 조회 오류:", error);
    res.status(500).json({ message: "이동 목록 조회 실패" });
  }
});

// 재고 이동 승인 (관리자 전용)
router.put("/transfers/:id/approve", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({ message: "이동 요청을 찾을 수 없습니다." });
    }

    if (transfer.status !== "대기") {
      return res.status(400).json({ message: "이미 처리된 요청입니다." });
    }

    // 재고 이동 처리
    await processStockTransfer(transfer);

    transfer.status = "승인";
    transfer.approvedBy = req.user._id;
    transfer.approvedAt = new Date();
    await transfer.save();

    res.json({ success: true, message: "재고 이동이 승인되었습니다." });
  } catch (error) {
    console.error("재고 이동 승인 오류:", error);
    res.status(500).json({ message: error.message || "승인 처리 실패" });
  }
});

// 재고 이동 거부 (관리자 전용)
router.put("/transfers/:id/reject", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const transfer = await StockTransfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({ message: "이동 요청을 찾을 수 없습니다." });
    }

    if (transfer.status !== "대기") {
      return res.status(400).json({ message: "이미 처리된 요청입니다." });
    }

    transfer.status = "거부";
    transfer.rejectionReason = rejectionReason;
    transfer.approvedBy = req.user._id;
    transfer.approvedAt = new Date();
    await transfer.save();

    res.json({ success: true, message: "재고 이동이 거부되었습니다." });
  } catch (error) {
    console.error("재고 이동 거부 오류:", error);
    res.status(500).json({ message: "거부 처리 실패" });
  }
});

// ==================== 최소재고 관리 ====================

// 최소재고 설정 조회
router.get("/minimum-stock", verifyToken, async (req, res) => {
  try {
    const minimumStocks = await MinimumStock.find()
      .populate("product", "productName unit")
      .populate("warehouse", "warehouseName")
      .populate("store", "storeNumber storeName")
      .populate("setBy", "name email");

    res.json(minimumStocks);
  } catch (error) {
    console.error("최소재고 조회 오류:", error);
    res.status(500).json({ message: "최소재고 조회 실패" });
  }
});

// 최소재고 설정 (관리자 전용)
router.post("/minimum-stock", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const {
      productId,
      warehouseId,
      storeId,
      minimumQuantity,
      reorderQuantity,
    } = req.body;

    const query = { product: productId };
    if (warehouseId) query.warehouse = warehouseId;
    if (storeId) query.store = storeId;

    // 기존 설정이 있으면 업데이트, 없으면 생성
    const existing = await MinimumStock.findOne(query);

    if (existing) {
      existing.minimumQuantity = minimumQuantity;
      existing.reorderQuantity = reorderQuantity;
      existing.setBy = req.user._id;
      existing.updatedAt = new Date();
      await existing.save();

      return res.json({ success: true, minimumStock: existing });
    }

    const newMinStock = await MinimumStock.create({
      product: productId,
      warehouse: warehouseId,
      store: storeId,
      minimumQuantity,
      reorderQuantity,
      setBy: req.user._id,
    });

    res.status(201).json({ success: true, minimumStock: newMinStock });
  } catch (error) {
    console.error("최소재고 설정 오류:", error);
    res.status(500).json({ message: "최소재고 설정 실패" });
  }
});

// 최소재고 미달 목록 조회
router.get("/low-stock", verifyToken, async (req, res) => {
  try {
    // 모든 재고 조회
    const allInventory = await Inventory.find()
      .populate("product", "productName unit category")
      .populate("warehouse", "warehouseName")
      .populate("store", "storeNumber storeName");

    // 최소재고 설정 조회
    const minimumStocks = await MinimumStock.find();

    // 최소재고 미달 항목 필터링
    const lowStockItems = [];

    for (const inv of allInventory) {
      const minStock = minimumStocks.find(ms => {
        const productMatch = ms.product.toString() === inv.product._id.toString();
        const warehouseMatch = inv.warehouse ? ms.warehouse?.toString() === inv.warehouse._id.toString() : false;
        const storeMatch = inv.store ? ms.store?.toString() === inv.store._id.toString() : false;
        return productMatch && (warehouseMatch || storeMatch);
      });

      if (minStock && inv.quantity <= minStock.minimumQuantity) {
        lowStockItems.push({
          ...inv.toObject(),
          minimumQuantity: minStock.minimumQuantity,
          reorderQuantity: minStock.reorderQuantity,
          shortage: minStock.minimumQuantity - inv.quantity,
        });
      }
    }

    res.json(lowStockItems);
  } catch (error) {
    console.error("최소재고 미달 조회 오류:", error);
    res.status(500).json({ message: "최소재고 미달 조회 실패" });
  }
});

// ==================== 헬퍼 함수 ====================

// 재고 이동 처리 함수
async function processStockTransfer(transfer) {
  const { product, fromWarehouse, fromStore, toWarehouse, toStore, quantity } = transfer;

  // 출발지 재고 감소
  const fromQuery = { product };
  if (fromWarehouse) fromQuery.warehouse = fromWarehouse;
  if (fromStore) fromQuery.store = fromStore;

  const fromInventory = await Inventory.findOne(fromQuery);
  if (!fromInventory || fromInventory.quantity < quantity) {
    throw new Error("출발지의 재고가 부족합니다.");
  }

  fromInventory.quantity -= quantity;
  fromInventory.lastUpdatedAt = new Date();
  await fromInventory.save();

  // 목적지 재고 증가 (없으면 생성)
  const toQuery = { product };
  if (toWarehouse) toQuery.warehouse = toWarehouse;
  if (toStore) toQuery.store = toStore;

  let toInventory = await Inventory.findOne(toQuery);

  if (toInventory) {
    toInventory.quantity += quantity;
    toInventory.lastUpdatedAt = new Date();
    await toInventory.save();
  } else {
    await Inventory.create({
      product,
      warehouse: toWarehouse,
      store: toStore,
      quantity,
      lastUpdatedAt: new Date(),
    });
  }

  transfer.status = "완료";
  transfer.completedAt = new Date();
  await transfer.save();
}

export default router;
