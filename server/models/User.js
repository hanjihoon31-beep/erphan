// server/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true }, // 사번
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["employee", "admin", "superadmin"], default: "employee" },
  isApproved: { type: Boolean, default: false }, // 관리자 승인 여부
  isActive: { type: Boolean, default: true }, // 계정 활성화 여부 (퇴사 시 false)
  createdAt: { type: Date, default: Date.now },
  inactivatedAt: { type: Date }, // 퇴사 처리 날짜
  inactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // 퇴사 처리한 관리자
  inactivationReason: { type: String }, // 퇴사 사유
});

export default mongoose;.model("User", userSchema);
