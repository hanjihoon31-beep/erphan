import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import ProductDisposal from "../models/ProductDisposal.js";
import Product from "../models/Product.js";
import Store from "../models/Store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, "../uploads/disposal")),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `disposal-${unique}${path.extname(file.originalname)}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /jpeg|jpg|png|gif/.test(file.mimetype) && /jpeg|jpg|png|gif/.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error("이미지 파일만 업로드 가능합니다."), ok);
  }
});

// … (생략) 등록/조회/승인/거부 라우트는 기존 로직 유지 …

// ⬇️ 엑셀 내보내기 (ESM)
router.post("/export", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { filters = {} } = req.body;

    const query = {};
    if (filters.storeId) query.store = filters.storeId;
    if (filters.status) query.status = filters.status;
    if (filters.reason) query.$or = [{ reason: filters.reason }, { adminModifiedReason: filters.reason }];
    if (filters.startDate && filters.endDate) {
      query.date = { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) };
    }

    const disposals = await ProductDisposal.find(query)
      .populate("store", "storeNumber storeName")
      .populate("product", "name category unit")
      .populate("requestedBy", "name email")
      .populate("approvedBy", "name email")
      .sort({ date: -1 });

    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("폐기 내역");

    ws.columns = [
      { header: "날짜", key: "date", width: 12 },
      { header: "매장", key: "store", width: 15 },
      { header: "제품명", key: "productName", width: 25 },
      { header: "카테고리", key: "category", width: 15 },
      { header: "수량", key: "quantity", width: 10 },
      { header: "단위", key: "unit", width: 10 },
      { header: "원래 사유", key: "originalReason", width: 15 },
      { header: "최종 사유", key: "finalReason", width: 15 },
      { header: "상세 사유", key: "reasonDetail", width: 30 },
      { header: "요청자", key: "requester", width: 15 },
      { header: "승인자", key: "approver", width: 15 },
      { header: "상태", key: "status", width: 10 },
      { header: "사진 수", key: "photoCount", width: 10 },
      { header: "관리자 메모", key: "adminNote", width: 30 }
    ];

    disposals.forEach(d => {
      ws.addRow({
        date: new Date(d.date).toLocaleDateString("ko-KR"),
        store: d.store?.storeName || "",
        productName: d.product?.name || "",
        category: d.product?.category || "",
        quantity: d.quantity,
        unit: d.product?.unit || "개",
        originalReason: d.reason,
        finalReason: d.adminModifiedReason || d.reason,
        reasonDetail: d.adminModifiedReasonDetail || d.reasonDetail || "",
        requester: d.requestedBy?.name || "",
        approver: d.approvedBy?.name || "",
        status: d.status,
        photoCount: d.photos?.length || 0,
        adminNote: d.adminNote || ""
      });
    });

    ws.getRow(1).font = { bold: true };

    const fileName = `폐기내역_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const outDir = path.join(__dirname, "../uploads/exports");
    const outPath = path.join(outDir, fileName);

    // 디렉터리 보장
    await (await import("fs/promises")).mkdir(outDir, { recursive: true });
    await wb.xlsx.writeFile(outPath);

    res.json({ success: true, fileName, downloadUrl: `/uploads/exports/${fileName}`, totalCount: disposals.length });
  } catch (e) {
    console.error("엑셀 내보내기 오류:", e);
    res.status(500).json({ message: "엑셀 내보내기 실패" });
  }
});

export default router;
