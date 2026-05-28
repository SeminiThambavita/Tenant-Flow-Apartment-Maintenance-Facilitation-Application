import mongoose from "mongoose";

const costReportSchema = new mongoose.Schema({
  // Reference to the issue/task
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Issue",
    required: true
  },

  // Staff member who created the report
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Property manager who approves/rejects
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  // Cost items breakdown
  costItems: [{
    itemName: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    quantity: {
      type: Number,
      default: 1
    },
    unitCost: {
      type: Number,
      required: true
    },
    cost: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      enum: ["labor", "materials", "transport", "other"],
      default: "other"
    }
  }],

  // Total cost
  totalCost: {
    type: Number,
    required: true,
    default: 0
  },

  // Cost breakdown summary
  costBreakdown: {
    laborCost: {
      type: Number,
      default: 0
    },
    materialsCost: {
      type: Number,
      default: 0
    },
    transportCost: {
      type: Number,
      default: 0
    },
    otherCost: {
      type: Number,
      default: 0
    }
  },

  // Status of the cost report
  status: {
    type: String,
    enum: [
      "draft",                    // Initial creation
      "submitted",                // Submitted for approval
      "approved",                 // Approved by manager
      "rejected"                  // Rejected by manager
    ],
    default: "draft"
  },

  // Rejection details
  rejectionRemarks: {
    type: String,
    default: ""
  },

  rejectedAt: {
    type: Date
  },

  // Approval details
  approvedAt: {
    type: Date
  },

  submittedAt: {
    type: Date
  },

  // Additional notes
  notes: {
    type: String,
    default: ""
  },

  // Link to generated invoice
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice"
  },

  // Revision number (for tracking edits)
  revisionNumber: {
    type: Number,
    default: 1
  },

  // Previous versions (for audit trail)
  previousVersions: [{
    revisionNumber: Number,
    costItems: mongoose.Schema.Types.Mixed,
    totalCost: Number,
    submittedAt: Date,
    rejectedAt: Date,
    rejectionRemarks: String
  }]

}, { timestamps: true });

// Index for faster queries
costReportSchema.index({ issue: 1, status: 1 });
costReportSchema.index({ createdBy: 1, status: 1 });
costReportSchema.index({ approvedBy: 1, status: 1 });

export default mongoose.model("CostReport", costReportSchema);
