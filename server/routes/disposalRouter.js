// server/routes/disposalRouter.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
const ProductDisposal = require("../models/ProductDisposal");
const Product = require("../models/Product");
const Store = require("../models/Store");

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("이미지 파일만 업로드 가능합니다."));
  }
});

// ==================== 폐기 관리 ====================

// 폐기 등록 (사진 포함)
router.post("/", verifyToken, upload.array("photos", 5), async (req, res) => {
  try {
    const { storeId, date, productId, quantity, reason, reasonDetail } = req.body;

    // 유효성 검증
    if (!storeId || !date || !productId || !quantity || !reason) {
      return res.status(400).json({
        message: "매장, 날짜, 제품, 수량, 사유는 필수입니다."
      });
    }

    if (reason === "기타" && !reasonDetail) {
      return res.status(400).json({
        message: "기타 사유를 선택한 경우 상세 사유를 입력해주세요."
      });
    }

    // 업로드된 사진 경로
    const photos = req.files ? req.files.map(file => file.filename) : [];

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

// 폐기 목록 조회
router.get("/", verifyToken, async (req, res) => {
  try {
    const { storeId, status, startDate, endDate, reason } = req.query;

    let query = {};

    if (storeId) {
      query.store = storeId;
    }

    if (status) {
      query.status = status;
    }

    if (reason) {
      query.$or = [
        { reason },
        { adminModifiedReason: reason }
      ];
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const disposals = await ProductDisposal.find(query)
      .populate("store", "storeNumber storeName")
      .populate("product", "name category unit")
      .populate("requestedBy", "name email")
      .populate("approvedBy", "name email")
      .sort({ requestedAt: -1 })
      .limit(200);

    res.json(disposals);
  } catch (error) {
    console.error("폐기 목록 조회 오류:", error);
    res.status(500).json({ message: "폐기 목록 조회 실패" });
  }
});

// 특정 폐기 상세 조회
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const disposal = await ProductDisposal.findById(req.params.id)
      .populate("store", "storeNumber storeName")
      .populate("product", "name category unit")
      .populate("requestedBy", "name email")
      .populate("approvedBy", "name email");

    if (!disposal) {
      return res.status(404).json({ message: "폐기 내역을 찾을 수 없습니다." });
    }

    res.json(disposal);
  } catch (error) {
    console.error("폐기 상세 조회 오류:", error);
    res.status(500).json({ message: "폐기 상세 조회 실패" });
  }
});

// 폐기 승인 (관리자) - 사유 수정 가능
router.patch("/:id/approve", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { adminModifiedReason, adminModifiedReasonDetail, adminNote } = req.body;

    const disposal = await ProductDisposal.findById(req.params.id);

    if (!disposal) {
      return res.status(404).json({ message: "폐기 내역을 찾을 수 없습니다." });
    }

    if (disposal.status !== "대기") {
      return res.status(400).json({ message: "이미 처리된 폐기 요청입니다." });
    }

    disposal.status = "승인";
    disposal.approvedBy = req.user._id;
    disposal.approvedAt = new Date();

    // 관리자가 사유를 수정한 경우
    if (adminModifiedReason) {
      disposal.adminModifiedReason = adminModifiedReason;
    }
    if (adminModifiedReasonDetail) {
      disposal.adminModifiedReasonDetail = adminModifiedReasonDetail;
    }
    if (adminNote) {
      disposal.adminNote = adminNote;
    }

    await disposal.save();

    // 재고에서 차감 (Product의 재고 관리가 있다면)
    // 필요시 구현

    await disposal.populate("store", "storeNumber storeName");
    await disposal.populate("product", "name category unit");
    await disposal.populate("requestedBy", "name email");
    await disposal.populate("approvedBy", "name email");

    res.json({ success: true, disposal });
  } catch (error) {
    console.error("폐기 승인 오류:", error);
    res.status(500).json({ message: "폐기 승인 실패" });
  }
});

// 폐기 거부 (관리자)
router.patch("/:id/reject", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const disposal = await ProductDisposal.findById(req.params.id);

    if (!disposal) {
      return res.status(404).json({ message: "폐기 내역을 찾을 수 없습니다." });
    }

    if (disposal.status !== "대기") {
      return res.status(400).json({ message: "이미 처리된 폐기 요청입니다." });
    }

    disposal.status = "거부";
    disposal.approvedBy = req.user._id;
    disposal.approvedAt = new Date();
    disposal.rejectionReason = rejectionReason;

    await disposal.save();

    await disposal.populate("store", "storeNumber storeName");
    await disposal.populate("product", "name category unit");
    await disposal.populate("requestedBy", "name email");
    await disposal.populate("approvedBy", "name email");

    res.json({ success: true, disposal });
  } catch (error) {
    console.error("폐기 거부 오류:", error);
    res.status(500).json({ message: "폐기 거부 실패" });
  }
});

// 폐기 내역 엑셀 내보내기
router.post("/export", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { filters } = req.body; // { storeId, startDate, endDate, reason, status }

    let query = {};

    if (filters.storeId) {
      query.store = filters.storeId;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.reason) {
      query.$or = [
        { reason: filters.reason },
        { adminModifiedReason: filters.reason }
      ];
    }

    if (filters.startDate && filters.endDate) {
      query.date = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    const disposals = await ProductDisposal.find(query)
      .populate("store", "storeNumber storeName")
      .populate("product", "name category unit")
      .populate("requestedBy", "name email")
      .populate("approvedBy", "name email")
      .sort({ date: -1 });

    // Excel 데이터 생성
    const ExcelJS = require("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("폐기 내역");

    // 헤더 설정
    worksheet.columns = [
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

    // 데이터 추가
    disposals.forEach(disposal => {
      worksheet.addRow({
        date: new Date(disposal.date).toLocaleDateString("ko-KR"),
        store: disposal.store.storeName,
        productName: disposal.product.name,
        category: disposal.product.category,
        quantity: disposal.quantity,
        unit: disposal.product.unit || "개",
        originalReason: disposal.reason,
        finalReason: disposal.adminModifiedReason || disposal.reason,
        reasonDetail: disposal.adminModifiedReasonDetail || disposal.reasonDetail || "",
        requester: disposal.requestedBy.name,
        approver: disposal.approvedBy ? disposal.approvedBy.name : "",
        status: disposal.status,
        photoCount: disposal.photos.length,
        adminNote: disposal.adminNote || ""
      });
    });

    // 헤더 스타일 설정
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" }
    };

    // 엑셀 파일 생성
    const fileName = `폐기내역_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filePath = path.join(__dirname, "../uploads/exports", fileName);

    await workbook.xlsx.writeFile(filePath);

    res.json({
      success: true,
      fileName,
      downloadUrl: `/uploads/exports/${fileName}`,
      totalCount: disposals.length
    });
  } catch (error) {
    console.error("엑셀 내보내기 오류:", error);
    res.status(500).json({ message: "엑셀 내보내기 실패" });
  }
});

module.exports = router;
