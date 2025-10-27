// server/routes/reportRouter.js
import express from 'express';
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
import Inventory from '../models/Inventory';
import MinimumStock from '../models/MinimumStock';

const router = express.Router();

// ==================== 엑셀 내보내기 ====================

// 최소재고 미달 발주 목록 엑셀 내보내기 데이터 생성
router.get("/reorder-list", verifyToken, async (req, res) => {
  try {
    // 모든 재고 조회
    const allInventory = await Inventory.find()
      .populate("product", "productName unit category productCode")
      .populate("warehouse", "warehouseName")
      .populate("store", "storeNumber storeName");

    // 최소재고 설정 조회
    const minimumStocks = await MinimumStock.find()
      .populate("product")
      .populate("warehouse")
      .populate("store");

    // 최소재고 미달 항목 필터링 및 발주 목록 생성
    const reorderList = [];

    for (const inv of allInventory) {
      const minStock = minimumStocks.find(ms => {
        const productMatch = ms.product._id.toString() === inv.product._id.toString();
        const warehouseMatch = inv.warehouse ? ms.warehouse?._id.toString() === inv.warehouse._id.toString() : false;
        const storeMatch = inv.store ? ms.store?._id.toString() === inv.store._id.toString() : false;
        return productMatch && (warehouseMatch || storeMatch);
      });

      if (minStock && inv.quantity <= minStock.minimumQuantity) {
        // 위치 정보
        let locationName = "";
        let locationType = "";

        if (inv.warehouse) {
          locationName = inv.warehouse.warehouseName;
          locationType = "창고";
        } else if (inv.store) {
          locationName = `${inv.store.storeNumber}번 매장 (${inv.store.storeName})`;
          locationType = "매장";
        }

        reorderList.push({
          productCode: inv.product.productCode || "-",
          productName: inv.product.productName,
          category: inv.product.category || "-",
          unit: inv.product.unit,
          locationType,
          locationName,
          currentStock: inv.quantity,
          minimumStock: minStock.minimumQuantity,
          shortage: minStock.minimumQuantity - inv.quantity,
          reorderQuantity: minStock.reorderQuantity,
          totalOrderQuantity: Math.max(minStock.reorderQuantity, minStock.minimumQuantity - inv.quantity),
        });
      }
    }

    // 제품명 기준으로 정렬
    reorderList.sort((a, b) => a.productName.localeCompare(b.productName, 'ko-KR'));

    res.json({
      success: true,
      data: reorderList,
      generatedAt: new Date(),
      totalItems: reorderList.length,
    });
  } catch (error) {
    console.error("발주 목록 생성 오류:", error);
    res.status(500).json({ message: "발주 목록 생성 실패" });
  }
});

// 전체 재고 현황 리포트 데이터
router.get("/inventory-report", verifyToken, async (req, res) => {
  try {
    const inventory = await Inventory.find()
      .populate("product", "productName unit category productCode storageType")
      .populate("warehouse", "warehouseName warehouseType")
      .populate("store", "storeNumber storeName")
      .sort({ "product.productName": 1 });

    const reportData = inventory.map(inv => {
      let locationName = "";
      let locationType = "";

      if (inv.warehouse) {
        locationName = inv.warehouse.warehouseName;
        locationType = "창고";
      } else if (inv.store) {
        locationName = `${inv.store.storeNumber}번 매장 (${inv.store.storeName})`;
        locationType = "매장";
      }

      return {
        productCode: inv.product.productCode || "-",
        productName: inv.product.productName,
        category: inv.product.category || "-",
        storageType: inv.product.storageType || "-",
        unit: inv.product.unit,
        locationType,
        locationName,
        quantity: inv.quantity,
        minimumStock: inv.minimumStock || 0,
        status: inv.quantity <= inv.minimumStock ? "부족" : "정상",
        lastUpdated: inv.lastUpdatedAt,
      };
    });

    res.json({
      success: true,
      data: reportData,
      generatedAt: new Date(),
      totalItems: reportData.length,
    });
  } catch (error) {
    console.error("재고 리포트 생성 오류:", error);
    res.status(500).json({ message: "재고 리포트 생성 실패" });
  }
});

export default router;
