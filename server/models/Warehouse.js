import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema(
  {
    warehouseName: { type: String, required: true },
    warehouseType: { type: String, enum: ["main", "sub"], default: "main" },
    location: { type: String },
    capacity: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model("Warehouse", warehouseSchema);
