// server/models/MinimumStock.js
const mongoose = require("mongoose");

const minimumStockSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },

  // 위치 정보 (창고 또는 매장)
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },

  // 최소 재고량
  minimumQuantity: { type: Number, required: true, default: 0 },

  // 자동 발주 수량 (최소재고 미달 시 발주할 수량)
  reorderQuantity: { type: Number, required: true, default: 0 },

  // 설정한 관리자
  setBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 복합 인덱스: 같은 제품의 같은 위치에 중복 설정 방지
minimumStockSchema.index({ product: 1, warehouse: 1, store: 1 }, { unique: true });

module.exports = mongoose.model("MinimumStock", minimumStockSchema);
