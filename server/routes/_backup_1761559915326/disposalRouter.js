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

// Multer ?¤ì • (?ê¸° ?¬ì§„ ?…ë¡œ??
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
    cb(new Error("?´ë?ì§€ ?Œì¼ë§??…ë¡œ??ê°€?¥í•©?ˆë‹¤."));
  }
});

// ==================== ?ê¸° ê´€ë¦?====================
// ?ê¸° ?±ë¡ (?¬ì§„ ?¬í•¨)
router.post("/", verifyToken, upload.array("photos", 5), async (req, res) => {
  try {
    const { storeId, date, productId, quantity, reason, reasonDetail } = req.body;

    if (!storeId || !date || !productId || !quantity || !reason) {
      return res.status(400).json({ message: "ë§¤ì¥, ? ì§œ, ?œí’ˆ, ?˜ëŸ‰, ?¬ìœ ???„ìˆ˜?…ë‹ˆ??" });
    }

    if (reason === "ê¸°í?" && !reasonDetail) {
      return res.status(400).json({ message: "ê¸°í? ?¬ìœ ë¥?? íƒ??ê²½ìš° ?ì„¸ ?¬ìœ ë¥??…ë ¥?´ì£¼?¸ìš”." });
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
    console.error("?ê¸° ?±ë¡ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?ê¸° ?±ë¡ ?¤íŒ¨" });
  }
});

// ???´í•˜ ê¸°ì¡´ ì½”ë“œ ? ì?
// (ì¤‘ëµ... ExcelJS ë¶€ë¶??¬í•¨)

export default router;
