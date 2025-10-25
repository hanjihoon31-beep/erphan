// server/models/Inventory.js
const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true }, // 품목 코드
  itemName: { type: String, required: true }, // 품목명
  category: {
    type: String,
    required: true,
    enum: ["food", "supplies", "equipment", "other"] // 식품, 비품, 장비, 기타
  },
  unit: { type: String, required: true }, // 단위 (개, kg, L 등)
  storeId: { type: String, ref: "Store" }, // 매장 코드
  warehouseId: { type: String, ref: "Warehouse" }, // 창고 코드
  locationName: { type: String }, // 매장명/창고명
  quantity: { type: Number, required: true, default: 0 }, // 재고량
  minQuantity: { type: Number, default: 0 }, // 최소 재고량
  unitPrice: { type: Number }, // 단가
  lastUpdated: { type: Date, default: Date.now }, // 최근 업데이트
  updatedBy: { type: String }, // 업데이트한 사용자
  notes: { type: String }, // 비고
  createdAt: { type: Date, default: Date.now },
});

// 인덱스 설정
inventorySchema.index({ storeId: 1 });
inventorySchema.index({ warehouseId: 1 });
inventorySchema.index({ itemId: 1, storeId: 1, warehouseId: 1 });

module.exports = mongoose.model("Inventory", inventorySchema);
