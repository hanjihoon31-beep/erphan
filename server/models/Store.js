// server/models/Store.js
const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
  storeId: { type: String, required: true, unique: true }, // 매장 코드
  name: { type: String, required: true }, // 매장명
  address: { type: String }, // 주소
  phone: { type: String }, // 전화번호
  manager: { type: String }, // 매장 관리자
  isActive: { type: Boolean, default: true }, // 운영 상태
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Store", storeSchema);
