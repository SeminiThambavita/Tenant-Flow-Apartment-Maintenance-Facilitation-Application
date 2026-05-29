import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  // Recipient of the notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Type of notification
  type: {
    type: String,
    enum: [
      "issue_reported",           // When tenant reports an issue
      "task_assigned",            // When task is assigned to staff
      "task_status_changed",      // When task status changes
      "assignment_notification"   // General assignment info
    ],
    required: true
  },

  // Related issue/task
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Issue",
    required: true
  },

  // Title and message
  title: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  // Additional data
  data: {
    previousStatus: String,
    newStatus: String,
    assignedStaffName: String,
    tenantName: String,
    issueType: String,
    unitNumber: String,
    building: String,
    invoiceId: String,
    invoiceNumber: String
  },

  // Read/unread status
  isRead: {
    type: Boolean,
    default: false
  },

  // Action URL (optional)
  actionUrl: {
    type: String
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }

}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
