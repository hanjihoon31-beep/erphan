// server/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const adminRouter = require("./routes/adminRouter");

dotenv.config();
const app = express();

// ✅ 보안 강화된 CORS 설정
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

// ✅ Body parser 설정 (요청 크기 제한)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ 보안 헤더 추가
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

// ✅ MongoDB 연결
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    // 개발 환경에서는 서버 계속 실행 (프로덕션에서는 종료)
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  });

// ✅ 라우터 연결
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRouter);

// ✅ Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "running",
    message: "ERP Server Running with Enhanced Security",
    version: "2.0.0"
  });
});

// ✅ 404 에러 핸들링
app.use((req, res) => {
  res.status(404).json({ message: "요청한 리소스를 찾을 수 없습니다." });
});

// ✅ 전역 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  // 상세한 에러 정보 노출 방지 (프로덕션)
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === "production"
    ? "서버 오류가 발생했습니다."
    : err.message;

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || "development"}`);
});
