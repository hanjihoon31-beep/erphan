// server/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "이름은 필수 입력 항목입니다."],
    trim: true,
    minlength: [2, "이름은 최소 2자 이상이어야 합니다."],
    maxlength: [50, "이름은 최대 50자를 초과할 수 없습니다."]
  },
  email: {
    type: String,
    required: [true, "이메일은 필수 입력 항목입니다."],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "올바른 이메일 형식이 아닙니다."]
  },
  password: {
    type: String,
    required: [true, "비밀번호는 필수 입력 항목입니다."],
    minlength: [6, "비밀번호는 최소 6자 이상이어야 합니다."]
  },
  role: {
    type: String,
    enum: {
      values: ["employee", "admin", "superadmin"],
      message: "{VALUE}는 유효하지 않은 역할입니다."
    },
    default: "employee"
  },
  status: {
    type: String,
    enum: {
      values: ["pending", "active", "rejected"],
      message: "{VALUE}는 유효하지 않은 상태입니다."
    },
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // createdAt, updatedAt 자동 관리
});

// 상태 인덱스 생성 (승인 대기 조회 성능 향상)
// 이메일은 unique: true로 이미 인덱스가 생성되므로 별도 선언 불필요
userSchema.index({ status: 1 });

module.exports = mongoose.model("User", userSchema);
