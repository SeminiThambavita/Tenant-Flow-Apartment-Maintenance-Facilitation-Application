import express from "express";
import { 
  createIssue, 
  getIssues, 
  getIssueById, 
  updateIssue, 
  deleteIssue 
} from "../controllers/issueController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create issue with file uploads (up to 10 files)
router.post("/", upload.array("media", 10), createIssue);

// Get all issues (for logged-in user)
router.get("/", getIssues);

// Get single issue by ID
router.get("/:id", getIssueById);

// Update issue (staff/admin)
router.put("/:id", updateIssue);

// Delete issue (admin only)
router.delete("/:id", deleteIssue);

export default router;
