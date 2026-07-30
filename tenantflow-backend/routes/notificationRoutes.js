import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} from "../controllers/notificationController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all notifications for user
router.get("/", getNotifications);

// Get unread notification count
router.get("/unread/count", getUnreadCount);

// Mark single notification as read
router.put("/:id/read", markAsRead);

// Mark all notifications as read
router.put("/read-all", markAllAsRead);

// Clear all notifications
router.delete("/clear-all", clearAllNotifications);

// Delete single notification (keep parameterized routes after fixed paths)
router.delete("/:id", deleteNotification);

export default router;
