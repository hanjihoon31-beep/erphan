// server/models/DailyCash.js
import mongoose from "mongoose";

const dailyCashSchema = new mongoose.Schema({
  // 매장
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true
  },

  // 날짜
  date: {
    type: Date,
    required: true
  },

  // 작성자 (당일 근무자)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // 입금 (당일 마감시 입금할 금액)
  deposit: {
    bill50000: { type: Number, default: 0 }, // 5만원권
    bill10000: { type: Number, default: 0 }, // 1만원권
    bill5000: { type: Number, default: 0 },  // 5천원권
    bill1000: { type: Number, default: 0 },  // 1천원권
    coin500: { type: Number, default: 0 },   // 500원
    coin100: { type: Number, default: 0 },   // 100원
    total: { type: Number, default: 0 }      // 총액
  },

  // 상품권 (당일 받은 상품권)
  giftCards: [{
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GiftCardType"
    },
    amount: { type: Number, default: 0 }
  }],

  // 권면 (패키지권, 티켓 등)
  // 같은 권종이지만 금액대가 다를 수 있음 (예: 11,000원권 3장, 8,000원권 2장)
  vouchers: [{
    voucherType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VoucherType",
      required: true
    },
    amount: { type: Number, required: true }, // 권면 금액
    quantity: { type: Number, required: true, min: 1 } // 수량
  }],

  // 이월 시재 (다음날을 위한 준비금)
  carryOver: {
    bill10000: { type: Number, default: 0 }, // 1만원권
    bill5000: { type: Number, default: 0 },  // 5천원권
    bill1000: { type: Number, default: 0 },  // 1천원권
    coin500: { type: Number, default: 0 },   // 500원
    coin100: { type: Number, default: 0 },   // 100원
    total: { type: Number, default: 0 }      // 총액
  },

  // 다음날 아침 확인 (실제 시재금 확인)
  morningCheck: {
    bill10000: { type: Number, default: 0 },
    bill5000: { type: Number, default: 0 },
    bill1000: { type: Number, default: 0 },
    coin500: { type: Number, default: 0 },
    coin100: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    checkedAt: { type: Date }
  },

  // 시재금 차이
  discrepancy: {
    hasDiscrepancy: { type: Boolean, default: false },
    amount: { type: Number, default: 0 }, // 차이 금액 (양수: 초과, 음수: 부족)
    note: { type: String }
  },

  // 판매 정보
  sales: {
    itemCount: { type: Number, default: 0 },   // 판매 갯수
    totalAmount: { type: Number, default: 0 }  // 판매 금액
  },

  // 상태
  status: {
    type: String,
    enum: ["대기", "작성중", "완료"],
    default: "대기"
  },

  // 메모
  note: { type: String },

  // 생성/수정 시간
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 인덱스 설정
dailyCashSchema.index({ store: 1, date: 1 }, { unique: true });

// 총액 자동 계산 메서드
dailyCashSchema.methods.calculateDepositTotal = function() {
  this.deposit.total =
    (this.deposit.bill50000 * 50000) +
    (this.deposit.bill10000 * 10000) +
    (this.deposit.bill5000 * 5000) +
    (this.deposit.bill1000 * 1000) +
    (this.deposit.coin500 * 500) +
    (this.deposit.coin100 * 100);
};

dailyCashSchema.methods.calculateCarryOverTotal = function() {
  this.carryOver.total =
    (this.carryOver.bill10000 * 10000) +
    (this.carryOver.bill5000 * 5000) +
    (this.carryOver.bill1000 * 1000) +
    (this.carryOver.coin500 * 500) +
    (this.carryOver.coin100 * 100);
};

dailyCashSchema.methods.calculateMorningCheckTotal = function() {
  this.morningCheck.total =
    (this.morningCheck.bill10000 * 10000) +
    (this.morningCheck.bill5000 * 5000) +
    (this.morningCheck.bill1000 * 1000) +
    (this.morningCheck.coin500 * 500) +
    (this.morningCheck.coin100 * 100);
};

// 차이 확인 메서드
dailyCashSchema.methods.checkDiscrepancy = function() {
  if (this.morningCheck.total > 0 && this.carryOver.total > 0) {
    const diff = this.morningCheck.total - this.carryOver.total;
    this.discrepancy.amount = diff;
    this.discrepancy.hasDiscrepancy = diff !== 0;
  }
};

// 저장 전 처리
dailyCashSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose;.model("DailyCash", dailyCashSchema);
