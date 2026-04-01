import express from "express";
import { createRecord, getRecords, getSummary, deleteRecord } from "../controllers/recordController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.post("/api/records", authenticate, authorize(["ADMIN"]), createRecord);
router.get("/api/records", authenticate, authorize(["VIEWER", "ANALYST", "ADMIN"]), getRecords);
router.get("/api/summary", authenticate, authorize(["ANALYST", "ADMIN"]), getSummary);
router.delete("/api/records/:id", authenticate, authorize(["ADMIN"]), deleteRecord);

export default router;
