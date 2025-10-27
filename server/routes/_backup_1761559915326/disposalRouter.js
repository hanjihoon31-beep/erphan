// server/routes/disposalRouter.js
import express from "express";
import multer from "multer";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import ProductDisposal from "../models/ProductDisposal.js";
import Product from "../models/Product.js";
import Store from "../models/Store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Multer 설정 (폐기 사진 업로드)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/disposal/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "disposal-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error("이미지 파일만 업로드 가능합니다."));
  }
});

// ==================== 폐기 관리 ====================
// 폐기 등록 (사진 포함)
router.post("/", verifyToken, upload.array("photos", 5), async (req, res) => {
  try {
    const { storeId, date, productId, quantity, reason, reasonDetail } = req.body;

    if (!storeId || !date || !productId || !quantity || !reason) {
      return res.status(400).json({ message: "매장, 날짜, 제품, 수량, 사유는 필수입니다." });
    }

    if (reason === "기타" && !reasonDetail) {
      return res.status(400).json({ message: "기타 사유를 선택한 경우 상세 사유를 입력해주세요." });
    }

    const photos = req.files ? req.files.map(f => f.filename) : [];

    const disposal = await ProductDisposal.create({
      store: storeId,
      date: new Date(date),
      product: productId,
      quantity: parseInt(quantity),
      reason,
      reasonDetail: reasonDetail || "",
      photos,
      requestedBy: req.user._id
    });

    await disposal.populate("store", "storeNumber storeName");
    await disposal.populate("product", "name category");
    await disposal.populate("requestedBy", "name email");

    res.status(201).json({ success: true, disposal });
  } catch (error) {
    console.error("폐기 등록 오류:", error);
    res.status(500).json({ message: "폐기 등록 실패" });
  }
});

// ✅ 이하 기존 코드 유지
// (중략... ExcelJS 부분 포함)

export default router;
