// server/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRouter = require("./routes/authRouter");
const adminRouter = require("./routes/adminRouter");
const inventoryRouter = require("./routes/inventoryRouter");
const reportRouter = require("./routes/reportRouter");
const dailyInventoryRouter = require("./routes/dailyInventoryRouter");
const equipmentRouter = require("./routes/equipmentRouter");
const attendanceRouter = require("./routes/attendanceRouter");
const attendanceCheckRouter = require("./routes/attendanceCheckRouter");
const payrollRouter = require("./routes/payrollRouter");
const giftCardRouter = require("./routes/giftCardRouter");
const dailyCashRouter = require("./routes/dailyCashRouter");
const disposalRouter = require("./routes/disposalRouter");
const voucherRouter = require("./routes/voucherRouter");

const { initDailyInventoryScheduler } = require("./utils/dailyInventoryScheduler");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// 정적 파일 제공 (업로드된 이미지)
app.use("/uploads", express.static("uploads"));

// ✅ MongoDB 연결
console.log("🔍 MongoDB 연결 시도 중...");
console.log("📍 URI:", process.env.MONGO_URI.replace(/:[^:]*@/, ':****@')); // 비밀번호 숨김

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB 연결 성공!");
    console.log("📦 데이터베이스:", mongoose.connection.name);
    // 일일 재고 자동 생성 스케줄러 시작
    initDailyInventoryScheduler();
  })
  .catch((err) => {
    console.error("❌ MongoDB 연결 실패!");
    console.error("에러 이름:", err.name);
    console.error("에러 메시지:", err.message);
    if (err.reason) console.error("상세 원인:", err.reason);
  });

// ✅ 라우터 연결
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/reports", reportRouter);
app.use("/api/daily-inventory", dailyInventoryRouter);
app.use("/api/equipment", equipmentRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/attendance-check", attendanceCheckRouter);
app.use("/api/payroll", payrollRouter);
app.use("/api/gift-cards", giftCardRouter);
app.use("/api/daily-cash", dailyCashRouter);
app.use("/api/disposal", disposalRouter);
app.use("/api/vouchers", voucherRouter);

app.get("/", (req, res) => {
  res.send("ERP Server Running with Cash Management & Voucher System ✅");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
