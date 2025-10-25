// server/models/Attendance.js
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, ref: "User" }, // 사번
  employeeName: { type: String, required: true }, // 근무자명
  date: { type: Date, required: true }, // 근무일
  workStart: { type: String }, // 출근시간 (HH:mm)
  workEnd: { type: String }, // 퇴근시간 (HH:mm)
  breakTime: { type: Number, default: 0 }, // 휴게시간 (분)
  overtimeHours: { type: Number, default: 0 }, // 추가근무시간 (시간)
  totalWorkHours: { type: Number, default: 0 }, // 총 근무시간 (시간)
  storeId: { type: String, ref: "Store" }, // 근무 매장
  notes: { type: String }, // 비고
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 인덱스 설정
attendanceSchema.index({ employeeId: 1, date: 1 });
attendanceSchema.index({ date: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
