import express from "express";
const router = express.Router();
router.get("/", (req, res) => res.send("Inventory Router OK"));
export default router;