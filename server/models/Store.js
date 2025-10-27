import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    storeNumber: { type: String, required: true, unique: true },
    storeName: { type: String, required: true },
    location: { type: String },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    phone: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Store", storeSchema);
