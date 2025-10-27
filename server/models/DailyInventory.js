// server/models/DailyInventory.js
import mongoose from "mongoose";

const dailyInventorySchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    date: { type: Date, required: true },

    previousClosingStock: { type: Number, default: 0 }, // 전일 마감
    morningStock: { type: Number, default: 0 },        // 오전 재고
    inboundQuantity: { type: Number, default: 0 },     // 입고 수량
    outboundQuantity: { type: Number, default: 0 },    // 출고 수량
    closingStock: { type: Number, default: 0 },        // 마감 재고
    discrepancy: { type: Number, default: 0 },         // 차이 수량
    discrepancyReason: { type: String },               // 차이 사유
    notes: { type: String },                           // 비고

    status: {
      type: String,
      enum: ["대기", "작성중", "승인요청", "승인", "거부"],
      default: "대기",
    },

    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    submittedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

// ✅ 정식 export 구문 (오타 수정됨)
export default mongoose.model("DailyInventory", dailyInventorySchema);
