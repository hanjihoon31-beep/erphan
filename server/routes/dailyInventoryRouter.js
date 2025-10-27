import express from "express";
const router = express.Router();
router.get("/", (req, res) => res.send("Daily Inventory Router OK"));
export default router;