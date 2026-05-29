import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      required: true
    },
    costReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CostReport"
    },
    propertyManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true
    },
    issueTitle: {
      type: String,
      required: true
    },
    issueType: {
      type: String
    },
    location: {
      building: String,
      unitNumber: String
    },
    status: {
      type: String,
      enum: ["submitted", "pending", "paid", "overdue", "cancelled"],
      default: "submitted"
    },
    
    // Cost breakdown from cost report
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
    
    // Legacy fields (for backward compatibility)
    laborCharge: {
      type: Number,
      default: 0
    },
    partsCharge: {
      type: Number,
      default: 0
    },
    
    total: {
      type: Number,
      required: true
    },
    
    issuedAt: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date
    },
    
    // Payment details
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending"
    },
    paymentMethod: {
      type: String,
      enum: ["payhere", "bank_transfer", "cash", "cheque"],
      default: "payhere"
    },
    paymentReference: {
      type: String
    },
    paidAt: {
      type: Date
    },
    paymentProof: {
      url: String,
      reference: String,
      timestamp: Date
    },
    
    notes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
