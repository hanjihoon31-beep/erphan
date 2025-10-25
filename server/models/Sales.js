// server/models/Sales.js
const mongoose = require("mongoose");

const salesSchema = new mongoose.Schema({
  date: { type: Date, required: true }, // 날짜
  storeId: { type: String, required: true, ref: "Store" }, // 매장 코드
  storeName: { type: String, required: true }, // 매장명
  dailySales: { type: Number, required: true, default: 0 }, // 일일 매출
  maxTemperature: { type: Number }, // 최고온도
  maxHumidity: { type: Number }, // 최고습도 (11시~20시)
  avgHumidity: { type: Number }, // 평균습도 (11시~20시)
  visitors: { type: Number }, // 입장객수 (마감 매장만)
  isClosingStore: { type: Boolean, default: false }, // 마감 매장 여부
  dayOfWeek: { type: String }, // 요일
  notes: { type: String }, // 비고
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 인덱스 설정
salesSchema.index({ date: 1, storeId: 1 }, { unique: true });
salesSchema.index({ date: 1 });

module.exports = mongoose.model("Sales", salesSchema);
