import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

import authRouter from "./routes/authRouter.js";
import adminRouter from "./routes/adminRouter.js";
import inventoryRouter from "./routes/inventoryRouter.js";
import reportRouter from "./routes/reportRouter.js";
import dailyInventoryRouter from "./routes/dailyInventoryRouter.js";
import equipmentRouter from "./routes/equipmentRouter.js";
import attendanceRouter from "./routes/attendanceRouter.js";
import attendanceCheckRouter from "./routes/attendanceCheckRouter.js";
import payrollRouter from "./routes/payrollRouter.js";
import giftCardRouter from "./routes/giftCardRouter.js";
import dailyCashRouter from "./routes/dailyCashRouter.js";
import disposalRouter from "./routes/disposalRouter.js";
import voucherRouter from "./routes/voucherRouter.js";
import approvalRouter from "./routes/approvalRouter.js";
import { initDailyInventoryScheduler } from "./utils/dailyInventoryScheduler.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// 정적 파일 제공 (업로드된 이미지)
app.use("/uploads", express.static("uploads"));

// ✅ MongoDB 연결
console.log("🔍 MongoDB 연결 시도 중...");
console.log("📍 URI:", process.env.MONGO_URI.replace(/:[^:]*@/, ":****@")); // 비밀번호 숨김

mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGO_URI, { dbName: "erphan_db" })
  .then(() => {
    console.log("✅ MongoDB 연결 성공!");
    console.log("📦 데이터베이스:", mongoose.connection.name);
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
app.use("/api/approvals", approvalRouter);

// ✅ 기본 라우트
app.get("/", (req, res) => {
  res.send("ERP Server Running with Cash Management & Voucher System ✅");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
