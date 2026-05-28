import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  // Reference to the issue
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Issue",
    required: true
  },

  // Staff member assigned to task
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Task description from issue
  description: {
    type: String,
    required: true
  },

  // Task status
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed", "on-hold"],
    default: "pending"
  },

  // Priority level
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium"
  },

  // Due date
  dueDate: {
    type: Date
  },

  // Start date
  startDate: {
    type: Date
  },

  // Completion date
  completionDate: {
    type: Date
  },

  // Estimated hours
  estimatedHours: {
    type: Number,
    default: 0
  },

  // Actual hours spent
  actualHours: {
    type: Number,
    default: 0
  },

  // Notes and comments
  notes: {
    type: String,
    default: ""
  },

  // Completion notes
  completionNotes: {
    type: String,
    default: ""
  },

  // Assigned by (property manager or admin)
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  // Building reference
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Building"
  },

  // Cost report reference if submitted
  costReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CostReport"
  }

}, { timestamps: true });

export default mongoose.model("Task", taskSchema);
