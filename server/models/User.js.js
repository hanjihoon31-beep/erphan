// server/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "manager", "staff", "superadmin"], default: "staff" },
  status: { type: String, enum: ["pending", "active", "rejected", "inactive"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  inactivatedAt: { type: Date }, // 퇴사 처리 날짜
  inactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // 퇴사 처리한 관리자
  inactivationReason: { type: String }, // 퇴사 사유
});

module.exports = mongoose.model("User", userSchema);
