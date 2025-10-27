// server/routes/equipmentRouter.js
import express from 'express';
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
import Equipment from '../models/Equipment';
import EquipmentHistory from '../models/EquipmentHistory';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// ==================== ?Œì¼ ?…ë¡œ???¤ì • ====================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/equipment/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("?´ë?ì§€ ?Œì¼ ?ëŠ” PDFë§??…ë¡œ??ê°€?¥í•©?ˆë‹¤."));
    }
  }
});

// ==================== ê¸°ë¬¼/ê¸°ê¸° ê´€ë¦?====================

// ë§¤ìž¥ë³?ê¸°ë¬¼/ê¸°ê¸° ëª©ë¡ ì¡°íšŒ
router.get("/store/:storeId", verifyToken, async (req, res) => {
  try {
    const { equipmentType, status } = req.query;

    let query = {
      store: req.params.storeId,
      isActive: true
    };

    if (equipmentType) {
      query.equipmentType = equipmentType;
    }

    if (status) {
      query.status = status;
    }

    const equipment = await Equipment.find(query)
      .populate("store", "storeNumber storeName")
      .populate("registeredBy", "name email")
      .sort({ createdAt: -1 });

    res.json(equipment);
  } catch (error) {
    console.error("ê¸°ë¬¼ ëª©ë¡ ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "ê¸°ë¬¼ ëª©ë¡ ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ?„ì²´ ê¸°ë¬¼/ê¸°ê¸° ëª©ë¡ ì¡°íšŒ (ê´€ë¦¬ìž??
router.get("/all", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { equipmentType, status, needsInspection } = req.query;

    let query = { isActive: true };

    if (equipmentType) {
      query.equipmentType = equipmentType;
    }

    if (status) {
      query.status = status;
    }

    // ?ê? ?„ìš” ??ª© ?„í„°
    if (needsInspection === "true") {
      const today = new Date();
      query.nextInspectionDate = { $lte: today };
    }

    const equipment = await Equipment.find(query)
      .populate("store", "storeNumber storeName")
      .populate("registeredBy", "name email")
      .sort({ nextInspectionDate: 1, createdAt: -1 });

    res.json(equipment);
  } catch (error) {
    console.error("?„ì²´ ê¸°ë¬¼ ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?„ì²´ ê¸°ë¬¼ ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ê¸°ë¬¼/ê¸°ê¸° ?ì„¸ ì¡°íšŒ
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate("store", "storeNumber storeName location")
      .populate("registeredBy", "name email");

    if (!equipment) {
      return res.status(404).json({ message: "ê¸°ë¬¼??ì°¾ì„ ???†ìŠµ?ˆë‹¤." });
    }

    // ?´ë ¥ ì¡°íšŒ
    const history = await EquipmentHistory.find({ equipment: req.params.id })
      .populate("performedBy", "name email")
      .sort({ actionDate: -1 })
      .limit(20);

    res.json({
      equipment,
      history
    });
  } catch (error) {
    console.error("ê¸°ë¬¼ ?ì„¸ ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "ê¸°ë¬¼ ?ì„¸ ì¡°íšŒ ?¤íŒ¨" });
  }
});

// ê¸°ë¬¼/ê¸°ê¸° ?±ë¡
router.post("/", verifyToken, upload.array("images", 5), async (req, res) => {
  try {
    const {
      storeId,
      equipmentName,
      equipmentType,
      manufacturer,
      model,
      serialNumber,
      purchaseDate,
      purchasePrice,
      warrantyEndDate,
      status,
      location,
      description,
      inspectionInterval
    } = req.body;

    // ?…ë¡œ?œëœ ?´ë?ì§€ ê²½ë¡œ??
    const images = req.files ? req.files.map(file => file.path) : [];

    // ?ê? ì£¼ê¸°ê°€ ?ˆìœ¼ë©??¤ìŒ ?ê???ê³„ì‚°
    let nextInspectionDate = null;
    if (inspectionInterval) {
      nextInspectionDate = new Date();
      nextInspectionDate.setDate(nextInspectionDate.getDate() + parseInt(inspectionInterval));
    }

    const equipment = await Equipment.create({
      store: storeId,
      equipmentName,
      equipmentType,
      manufacturer,
      model,
      serialNumber,
      purchaseDate,
      purchasePrice,
      warrantyEndDate,
      status: status || "?•ìƒ",
      location,
      images,
      description,
      inspectionInterval,
      lastInspectionDate: new Date(),
      nextInspectionDate,
      registeredBy: req.user._id
    });

    const populated = await Equipment.findById(equipment._id)
      .populate("store", "storeNumber storeName");

    res.status(201).json({ success: true, equipment: populated });
  } catch (error) {
    console.error("ê¸°ë¬¼ ?±ë¡ ?¤ë¥˜:", error);
    res.status(500).json({ message: "ê¸°ë¬¼ ?±ë¡ ?¤íŒ¨" });
  }
});

// ê¸°ë¬¼/ê¸°ê¸° ?˜ì •
router.put("/:id", verifyToken, upload.array("newImages", 5), async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: "ê¸°ë¬¼??ì°¾ì„ ???†ìŠµ?ˆë‹¤." });
    }

    const {
      equipmentName,
      equipmentType,
      manufacturer,
      model,
      serialNumber,
      purchaseDate,
      purchasePrice,
      warrantyEndDate,
      status,
      location,
      description,
      inspectionInterval,
      existingImages // ê¸°ì¡´ ?´ë?ì§€ ì¤?? ì???ê²ƒë“¤
    } = req.body;

    // ?ˆë¡œ ?…ë¡œ?œëœ ?´ë?ì§€
    const newImages = req.files ? req.files.map(file => file.path) : [];

    // ê¸°ì¡´ ?´ë?ì§€ + ???´ë?ì§€
    let images = [];
    if (existingImages) {
      images = Array.isArray(existingImages) ? existingImages : [existingImages];
    }
    images = [...images, ...newImages];

    // ?…ë°?´íŠ¸
    equipment.equipmentName = equipmentName || equipment.equipmentName;
    equipment.equipmentType = equipmentType || equipment.equipmentType;
    equipment.manufacturer = manufacturer || equipment.manufacturer;
    equipment.model = model || equipment.model;
    equipment.serialNumber = serialNumber || equipment.serialNumber;
    equipment.purchaseDate = purchaseDate || equipment.purchaseDate;
    equipment.purchasePrice = purchasePrice || equipment.purchasePrice;
    equipment.warrantyEndDate = warrantyEndDate || equipment.warrantyEndDate;
    equipment.location = location || equipment.location;
    equipment.description = description || equipment.description;
    equipment.images = images;
    equipment.updatedAt = new Date();

    // ?íƒœ ë³€ê²????´ë ¥ ê¸°ë¡
    if (status && status !== equipment.status) {
      await EquipmentHistory.create({
        equipment: equipment._id,
        actionType: "ê¸°í?",
        description: `?íƒœ ë³€ê²? ${equipment.status} ??${status}`,
        previousStatus: equipment.status,
        newStatus: status,
        performedBy: req.user._id
      });

      equipment.status = status;
    }

    // ?ê? ì£¼ê¸° ë³€ê²????¤ìŒ ?ê????¬ê³„??
    if (inspectionInterval && inspectionInterval !== equipment.inspectionInterval) {
      equipment.inspectionInterval = inspectionInterval;
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + parseInt(inspectionInterval));
      equipment.nextInspectionDate = nextDate;
    }

    await equipment.save();

    const updated = await Equipment.findById(equipment._id)
      .populate("store", "storeNumber storeName");

    res.json({ success: true, equipment: updated });
  } catch (error) {
    console.error("ê¸°ë¬¼ ?˜ì • ?¤ë¥˜:", error);
    res.status(500).json({ message: "ê¸°ë¬¼ ?˜ì • ?¤íŒ¨" });
  }
});

// ê¸°ë¬¼/ê¸°ê¸° ?? œ
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: "ê¸°ë¬¼??ì°¾ì„ ???†ìŠµ?ˆë‹¤." });
    }

    equipment.isActive = false;
    equipment.updatedAt = new Date();
    await equipment.save();

    res.json({ success: true, message: "ê¸°ë¬¼???? œ?˜ì—ˆ?µë‹ˆ??" });
  } catch (error) {
    console.error("ê¸°ë¬¼ ?? œ ?¤ë¥˜:", error);
    res.status(500).json({ message: "ê¸°ë¬¼ ?? œ ?¤íŒ¨" });
  }
});

// ==================== ê¸°ë¬¼/ê¸°ê¸° ?ê? ë°??´ë ¥ ê´€ë¦?====================

// ?ê? ê¸°ë¡ ì¶”ê?
router.post("/:id/inspection", verifyToken, async (req, res) => {
  try {
    const { description, cost, newStatus } = req.body;

    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: "ê¸°ë¬¼??ì°¾ì„ ???†ìŠµ?ˆë‹¤." });
    }

    // ?ê? ?´ë ¥ ì¶”ê?
    await EquipmentHistory.create({
      equipment: equipment._id,
      actionType: "?ê?",
      description,
      previousStatus: equipment.status,
      newStatus: newStatus || equipment.status,
      cost,
      performedBy: req.user._id,
      actionDate: new Date()
    });

    // ê¸°ë¬¼ ?íƒœ ?…ë°?´íŠ¸
    if (newStatus) {
      equipment.status = newStatus;
    }

    equipment.lastInspectionDate = new Date();

    // ?¤ìŒ ?ê???ê³„ì‚°
    if (equipment.inspectionInterval) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + equipment.inspectionInterval);
      equipment.nextInspectionDate = nextDate;
    }

    await equipment.save();

    res.json({ success: true, message: "?ê???ê¸°ë¡?˜ì—ˆ?µë‹ˆ??" });
  } catch (error) {
    console.error("?ê? ê¸°ë¡ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?ê? ê¸°ë¡ ?¤íŒ¨" });
  }
});

// ?˜ë¦¬ ê¸°ë¡ ì¶”ê?
router.post("/:id/repair", verifyToken, upload.array("attachments", 3), async (req, res) => {
  try {
    const { description, cost, newStatus } = req.body;

    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ message: "ê¸°ë¬¼??ì°¾ì„ ???†ìŠµ?ˆë‹¤." });
    }

    const attachments = req.files ? req.files.map(file => file.path) : [];

    // ?˜ë¦¬ ?´ë ¥ ì¶”ê?
    await EquipmentHistory.create({
      equipment: equipment._id,
      actionType: "?˜ë¦¬",
      description,
      previousStatus: equipment.status,
      newStatus: newStatus || "?•ìƒ",
      cost,
      attachments,
      performedBy: req.user._id,
      actionDate: new Date()
    });

    // ê¸°ë¬¼ ?íƒœ ?…ë°?´íŠ¸
    equipment.status = newStatus || "?•ìƒ";
    await equipment.save();

    res.json({ success: true, message: "?˜ë¦¬ ?´ì—­??ê¸°ë¡?˜ì—ˆ?µë‹ˆ??" });
  } catch (error) {
    console.error("?˜ë¦¬ ê¸°ë¡ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?˜ë¦¬ ê¸°ë¡ ?¤íŒ¨" });
  }
});

// ?´ë ¥ ì¡°íšŒ
router.get("/:id/history", verifyToken, async (req, res) => {
  try {
    const history = await EquipmentHistory.find({ equipment: req.params.id })
      .populate("performedBy", "name email")
      .sort({ actionDate: -1 });

    res.json(history);
  } catch (error) {
    console.error("?´ë ¥ ì¡°íšŒ ?¤ë¥˜:", error);
    res.status(500).json({ message: "?´ë ¥ ì¡°íšŒ ?¤íŒ¨" });
  }
});

export default router;
