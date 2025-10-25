// server/models/Warehouse.js
const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema({
  warehouseName: { type: String, required: true, unique: true },
  warehouseType: {
    type: String,
    enum: ["외부창고(사무실)", "내부창고(암담)", "내부창고(버거)", "냉동창고"],
    required: true
  },
  location: { type: String },
  capacity: { type: Number }, // 최대 수용량 (선택)
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Warehouse", warehouseSchema);
