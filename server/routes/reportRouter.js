import express from "express";
const router = express.Router();
router.get("/", (req, res) => res.send("Report Router OK"));
export default router;