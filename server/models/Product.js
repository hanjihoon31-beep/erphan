// server/models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productCode: { type: String, unique: true, sparse: true }, // SKU 코드 (선택)
  productName: { type: String, required: true },
  category: { type: String }, // 예: "젤라또", "음료", "재료" 등
  unit: { type: String, default: "개" }, // 단위: 개, kg, L 등
  storageType: {
    type: String,
    enum: ["냉동", "냉장", "상온"],
    default: "상온"
  },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// 제품명으로 검색할 수 있도록 인덱스 추가
productSchema.index({ productName: 'text' });

module.exports = mongoose.model("Product", productSchema);
