import express from "express";
const router = express.Router();
router.post("/login", (req, res) => res.send("Auth Router OK"));
export default router;