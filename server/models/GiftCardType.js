// server/models/GiftCardType.js
import mongoose from "mongoose";

const giftCardTypeSchema = new mongoose.Schema({
  // 상품권 이름
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  // 활성 상태
  isActive: {
    type: Boolean,
    default: true
  },

  // 등록자
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // 등록일
  createdAt: {
    type: Date,
    default: Date.now
  },

  // 비활성화 정보
  deactivatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  deactivatedAt: {
    type: Date
  }
});

export default mongoose;.model("GiftCardType", giftCardTypeSchema);
