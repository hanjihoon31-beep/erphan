// server/models/DailyInventoryTemplate.js
const mongoose = require("mongoose");

const dailyInventoryTemplateSchema = new mongoose.Schema({
  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },

  // 템플릿 활성화 여부
  isActive: { type: Boolean, default: true },

  // 순서 (화면 표시 순서)
  displayOrder: { type: Number, default: 0 },

  // 설정한 관리자
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 복합 인덱스: 같은 매장에 같은 제품 중복 방지
dailyInventoryTemplateSchema.index({ store: 1, product: 1 }, { unique: true });

module.exports = mongoose.model("DailyInventoryTemplate", dailyInventoryTemplateSchema);
