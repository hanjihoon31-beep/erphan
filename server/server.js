// server/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRouter = require("./routes/authRouter");
const adminRouter = require("./routes/adminRouter");
const inventoryRouter = require("./routes/inventoryRouter");
const reportRouter = require("./routes/reportRouter");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ✅ MongoDB 연결
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ 라우터 연결
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/reports", reportRouter);

app.get("/", (req, res) => {
  res.send("ERP Server Running with Advanced Inventory Management System ✅");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
