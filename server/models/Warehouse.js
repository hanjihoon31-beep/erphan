// server/models/Warehouse.js
const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema({
  warehouseId: { type: String, required: true, unique: true }, // 창고 코드
  name: { type: String, required: true }, // 창고명
  address: { type: String }, // 주소
  phone: { type: String }, // 전화번호
  manager: { type: String }, // 창고 관리자
  isActive: { type: Boolean, default: true }, // 운영 상태
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Warehouse", warehouseSchema);
