// server/models/DailyInventory.js
import mongoose from "mongoose";

const dailyInventorySchema = new mongoose.Schema({
  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },

  // 날짜 (YYYY-MM-DD 형식)
  date: { type: Date, required: true },

  // 전날 마감 재고 (자동 복사)
  previousClosingStock: { type: Number, default: 0 },

  // 아침 재고 (근무자 입력)
  morningStock: { type: Number },

  // 마감 재고 (근무자 입력)
  closingStock: { type: Number },

  // 입고 수량 (오늘 들어온 재고)
  inboundQuantity: { type: Number, default: 0 },

  // 출고 수량 (판매/사용)
  outboundQuantity: { type: Number, default: 0 },

  // 재고 차이 (아침재고 - 전날마감재고)
  discrepancy: { type: Number, default: 0 },

  // 재고 차이 사유
  discrepancyReason: { type: String },

  // 상태
  status: {
    type: String,
    enum: ["대기", "작성중", "승인요청", "승인", "거부"],
    default: "대기"
  },

  // 거부 사유
  rejectionReason: { type: String },

  // 작성자 (근무자)
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // 승인자 (관리자)
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // 메모
  notes: { type: String },

  // 타임스탬프
  submittedAt: { type: Date },
  approvedAt: { type: Date },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 복합 인덱스: 같은 매장, 같은 제품, 같은 날짜 중복 방지
dailyInventorySchema.index({ store: 1, product: 1, date: 1 }, { unique: true });

// 날짜 및 매장 기준 조회 최적화
dailyInventorySchema.index({ store: 1, date: -1 });
dailyInventorySchema.index({ status: 1, date: -1 });

export default mongoose;.model("DailyInventory", dailyInventorySchema);
