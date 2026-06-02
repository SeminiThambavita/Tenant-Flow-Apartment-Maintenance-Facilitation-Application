import mongoose from "mongoose";

const issueSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  // Section 1: Issue Type
  issueType: {
    type: String,
    enum: ["plumbing", "electrical", "cleaning", "carpentry", "other"],
    required: true
  },
  
  // Section 2: Location (Mandatory)
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Building",
    required: true
  },
  floor: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  specificSpot: {
    type: String,
    required: true
  },
  
  // Legacy fields (for backward compatibility)
  buildingName: {
    type: String
  },
  unitNumber: {
    type: String
  },
  
  // Section 3: Description
  description: {
    type: String,
    maxlength: 500,
    default: ""
  },

  urgency: {
    type: String,
    enum: ["urgent", "standard", "low"],
    default: "standard"
  },

  specialArrangements: {
    specialAccess: {
      type: Boolean,
      default: false
    },
    petsInUnit: {
      type: Boolean,
      default: false
    },
    callBeforeArriving: {
      type: Boolean,
      default: false
    }
  },
  
  // Section 4: Media files
  media: [{
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video", "audio"], required: true },
    filename: { type: String }
  }],
  
  // Status tracking
  status: {
    type: String,
    enum: [
      "new",
      "assigned",
      "in progress",
      "tenant confirmed",
      "completed",
      "cost report submitted",
      "cost report rejected",
      "invoice issued",
      "payment pending",
      "payment done",
      "task done"
    ],
    default: "new"
  },
  
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  
  // Scheduled start date set by manager when assigning
  scheduledStartDate: {
    type: Date
  },

  // Optional scheduled start time (stored as "HH:MM" string)
  scheduledStartTime: {
    type: String
  },

  // Whether a start-date reminder has already been sent
  startDateReminderSent: {
    type: Boolean,
    default: false
  },

  // Assigned staff member
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  // Property manager handling this issue
  propertyManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  
  // Resolution details
  resolvedAt: {
    type: Date
  },
  resolutionNotes: {
    type: String
  },

  // Status history for audit trail
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],

  // Cost report flag
  costReportRequired: {
    type: Boolean,
    default: false
  },

  costReportCreatedAt: {
    type: Date
  },

  // Current cost report
  currentCostReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CostReport"
  },

  // Generated invoice
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice"
  },

  // Payment tracking
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending"
  },

  paymentCompletedAt: {
    type: Date
  },

  paymentAmount: {
    type: Number,
    default: 0
  },

  paymentReference: {
    type: String
  }
  
}, { timestamps: true });

export default mongoose.model("Issue", issueSchema);
