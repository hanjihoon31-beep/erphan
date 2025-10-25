// server/models/Inventory.js
const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },

  // 위치 정보 (창고 또는 매장 중 하나만 설정)
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },

  // 재고 수량
  quantity: { type: Number, required: true, default: 0 },

  // 안전재고/최소재고 (이 위치에서의 최소 유지 수량)
  minimumStock: { type: Number, default: 0 },

  // 마지막 업데이트 정보
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  lastUpdatedAt: { type: Date, default: Date.now },

  createdAt: { type: Date, default: Date.now },
});

// 복합 인덱스: 같은 제품이 같은 위치에 중복되지 않도록
inventorySchema.index({ product: 1, warehouse: 1, store: 1 }, { unique: true });

// 가상 필드: 위치 타입 확인
inventorySchema.virtual('locationType').get(function() {
  return this.warehouse ? 'warehouse' : 'store';
});

module.exports = mongoose.model("Inventory", inventorySchema);
