// server/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true }, // 사번 (아이디로 사용)
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["superadmin", "admin", "employee"], // 최고관리자, 관리자, 근무자
    default: "employee"
  },
  status: {
    type: String,
    enum: ["pending", "active", "rejected"],
    default: "pending"
  },
  permissions: {
    attendance: { type: Boolean, default: false }, // 근무관리 접근권한
    sales: { type: Boolean, default: false }, // 매출관리 접근권한
    inventory: { type: Boolean, default: false }, // 재고관리 접근권한
    store: { type: Boolean, default: false }, // 매장관리 접근권한
    user: { type: Boolean, default: false }, // 사용자관리 접근권한
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
