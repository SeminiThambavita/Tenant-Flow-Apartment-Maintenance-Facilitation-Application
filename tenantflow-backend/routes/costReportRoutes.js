import express from "express";
import {
  createCostReport,
  getCostReportById,
  getCostReportsByIssue,
  updateCostReport,
  submitCostReport,
  approveCostReport,
  rejectCostReport,
  getPendingCostReports
} from "../controllers/costReportController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create new cost report (staff)
router.post("/", createCostReport);

// Get pending cost reports for manager
router.get("/manager/pending", getPendingCostReports);

// Get cost reports for an issue
router.get("/issue/:issueId", getCostReportsByIssue);

// Get cost report details
router.get("/:id", getCostReportById);

// Update cost report (staff - draft/rejected only)
router.put("/:id", updateCostReport);

// Submit cost report for approval (staff)
router.post("/:id/submit", submitCostReport);

// Approve cost report (manager)
router.post("/:id/approve", approveCostReport);

// Reject cost report (manager)
router.post("/:id/reject", rejectCostReport);

export default router;
