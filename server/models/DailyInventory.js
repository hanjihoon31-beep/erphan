import mongoose from "mongoose";

const dailyInventorySchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    date: { type: Date, required: true },

    previousClosingStock: { type: Number, default: 0 },
    morningStock: { type: Number, default: 0 },
    inboundQuantity: { type: Number, default: 0 },
    outboundQuantity: { type: Number, default: 0 },
    closingStock: { type: Number, default: 0 },
    discrepancy: { type: Number, default: 0 },
    discrepancyReason: { type: String },
    notes: { type: String },

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

export default mongoose.model("DailyInventory", dailyInventorySchema);
