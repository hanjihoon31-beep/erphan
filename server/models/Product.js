import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productCode: { type: String },
    productName: { type: String, required: true },
    category: { type: String },
    unit: { type: String },
    storageType: { type: String },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
