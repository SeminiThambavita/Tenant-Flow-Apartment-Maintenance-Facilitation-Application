import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
} from "../controllers/taskController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create task (admin/property manager only)
router.post("/", createTask);

// Get all tasks (staff sees own, admin sees all)
router.get("/", getTasks);

// Get single task by ID
router.get("/:id", getTaskById);

// Update task (assigned staff or admin)
router.put("/:id", updateTask);

// Delete task (admin only)
router.delete("/:id", deleteTask);

export default router;
