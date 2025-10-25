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

const { initDailyInventoryScheduler } = require("./utils/dailyInventoryScheduler");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// 정적 파일 제공 (업로드된 이미지)
app.use("/uploads", express.static("uploads"));

// ✅ MongoDB 연결
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    // 일일 재고 자동 생성 스케줄러 시작
    initDailyInventoryScheduler();
  })
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

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

app.get("/", (req, res) => {
  res.send("ERP Server Running with Cash Management & Disposal System ✅");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
