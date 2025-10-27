// server/server.js  (ESM 기준)
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";

// ⬇️ ESM에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 정적 파일 (업로드)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 라우터 (반드시 .js 확장자)
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

// 라우터 장착
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

// 루트 헬스체크
app.get("/", (_req, res) => {
  res.send("ERP Server Running ✅");
});

// MongoDB 연결
mongoose.set("strictQuery", false);
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/erphan_db";

console.log("🔍 MongoDB 연결 시도:", mongoUri.replace(/:[^@]*@/, ":****@"));

try {
  await mongoose.connect(mongoUri, { dbName: "erphan_db" });
  console.log("✅ MongoDB connected:", mongoose.connection.name);
} catch (err) {
  console.error("❌ MongoDB connection error:", err?.message || err);
  process.exit(1);
}

// 서버 실행
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
