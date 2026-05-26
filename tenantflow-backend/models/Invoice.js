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
      ref: "Issue"
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
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending"
    },
    laborCharge: {
      type: Number,
      required: true
    },
    partsCharge: {
      type: Number,
      required: true
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
    notes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
