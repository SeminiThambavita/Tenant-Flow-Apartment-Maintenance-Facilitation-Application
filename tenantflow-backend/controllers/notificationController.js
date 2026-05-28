import Notification from "../models/Notification.js";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount
} from "../services/notificationService.js";

// @desc    Get all notifications for logged-in user
// @route   GET /notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const { limit = 20, skip = 0, unreadOnly = false } = req.query;

    let query = { recipient: req.user._id };

    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate("recipient", "name email")
      .populate("issue", "issueType building unitNumber status")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Notification.countDocuments(query);

    return res.json({
      count: notifications.length,
      total,
      notifications
    });

  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
};

// @desc    Get unread notification count
// @route   GET /notifications/unread/count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const count = await getUnreadNotificationCount(req.user._id);

    return res.json({ unreadCount: count });

  } catch (error) {
    console.error("Get unread count error:", error);
    return res.status(500).json({ message: "Failed to fetch unread count", error: error.message });
  }
};

// @desc    Mark single notification as read
// @route   PUT /notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this notification" });
    }

    await markNotificationAsRead(req.params.id);

    return res.json({ message: "Notification marked as read" });

  } catch (error) {
    console.error("Mark as read error:", error);
    return res.status(500).json({ message: "Failed to mark notification as read", error: error.message });
  }
};

// @desc    Mark all notifications as read for user
// @route   PUT /notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    await markAllNotificationsAsRead(req.user._id);

    return res.json({ message: "All notifications marked as read" });

  } catch (error) {
    console.error("Mark all as read error:", error);
    return res.status(500).json({ message: "Failed to mark all notifications as read", error: error.message });
  }
};

// @desc    Delete notification
// @route   DELETE /notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this notification" });
    }

    await Notification.deleteOne({ _id: req.params.id });

    return res.json({ message: "Notification deleted successfully" });

  } catch (error) {
    console.error("Delete notification error:", error);
    return res.status(500).json({ message: "Failed to delete notification", error: error.message });
  }
};

// @desc    Delete all notifications for user
// @route   DELETE /notifications/clear-all
// @access  Private
export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });

    return res.json({ message: "All notifications cleared" });

  } catch (error) {
    console.error("Clear all notifications error:", error);
    return res.status(500).json({ message: "Failed to clear notifications", error: error.message });
  }
};
