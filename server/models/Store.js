// server/models/Store.js
import mongoose from "mongoose";

const storeSchema = new mongoose.Schema({
  storeNumber: { type: Number, required: true, unique: true }, // 1, 2, 3, ..., 12
  storeName: { type: String, required: true },
  location: { type: String },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose;.model("Store", storeSchema);
