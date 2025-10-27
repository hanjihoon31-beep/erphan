// server/routes/reportRouter.js
import express from 'express';
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
import Inventory from '../models/Inventory';
import MinimumStock from '../models/MinimumStock';

const router = express.Router();

// ==================== ?‘ì? ?´ë³´?´ê¸° ====================

// ìµœì†Œ?¬ê³  ë¯¸ë‹¬ ë°œì£¼ ëª©ë¡ ?‘ì? ?´ë³´?´ê¸° ?°ì´???ì„±
router.get("/reorder-list", verifyToken, async (req, res) => {
  try {
    // ëª¨ë“  ?¬ê³  ì¡°íšŒ
    const allInventory = await Inventory.find()
      .populate("product", "productName unit category productCode")
      .populate("warehouse", "warehouseName")
      .populate("store", "storeNumber storeName");

    // ìµœì†Œ?¬ê³  ?¤ì • ì¡°íšŒ
    const minimumStocks = await MinimumStock.find()
      .populate("product")
      .populate("warehouse")
      .populate("store");

    // ìµœì†Œ?¬ê³  ë¯¸ë‹¬ ??ª© ?„í„°ë§?ë°?ë°œì£¼ ëª©ë¡ ?ì„±
    const reorderList = [];

    for (const inv of allInventory) {
      const minStock = minimumStocks.find(ms => {
        const productMatch = ms.product._id.toString() === inv.product._id.toString();
        const warehouseMatch = inv.warehouse ? ms.warehouse?._id.toString() === inv.warehouse._id.toString() : false;
        const storeMatch = inv.store ? ms.store?._id.toString() === inv.store._id.toString() : false;
        return productMatch && (warehouseMatch || storeMatch);
      });

      if (minStock && inv.quantity <= minStock.minimumQuantity) {
        // ?„ì¹˜ ?•ë³´
        let locationName = "";
        let locationType = "";

        if (inv.warehouse) {
          locationName = inv.warehouse.warehouseName;
          locationType = "ì°½ê³ ";
        } else if (inv.store) {
          locationName = `${inv.store.storeNumber}ë²?ë§¤ìž¥ (${inv.store.storeName})`;
          locationType = "ë§¤ìž¥";
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

    // ?œí’ˆëª?ê¸°ì??¼ë¡œ ?•ë ¬
    reorderList.sort((a, b) => a.productName.localeCompare(b.productName, 'ko-KR'));

    res.json({
      success: true,
      data: reorderList,
      generatedAt: new Date(),
      totalItems: reorderList.length,
    });
  } catch (error) {
    console.error("ë°œì£¼ ëª©ë¡ ?ì„± ?¤ë¥˜:", error);
    res.status(500).json({ message: "ë°œì£¼ ëª©ë¡ ?ì„± ?¤íŒ¨" });
  }
});

// ?„ì²´ ?¬ê³  ?„í™© ë¦¬í¬???°ì´??
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
        locationType = "ì°½ê³ ";
      } else if (inv.store) {
        locationName = `${inv.store.storeNumber}ë²?ë§¤ìž¥ (${inv.store.storeName})`;
        locationType = "ë§¤ìž¥";
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
        status: inv.quantity <= inv.minimumStock ? "ë¶€ì¡? : "?•ìƒ",
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
    console.error("?¬ê³  ë¦¬í¬???ì„± ?¤ë¥˜:", error);
    res.status(500).json({ message: "?¬ê³  ë¦¬í¬???ì„± ?¤íŒ¨" });
  }
});

export default router;
