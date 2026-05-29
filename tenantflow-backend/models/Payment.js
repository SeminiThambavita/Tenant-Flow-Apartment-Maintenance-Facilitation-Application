import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    invoiceNumber: {
      type: String
    },
    taskId: {
      type: String
    },
    taskName: {
      type: String
    },
    tenantName: {
      type: String
    },
    tenantEmail: {
      type: String
    },
    tenantPhone: {
      type: String
    },
    tenantUnit: {
      type: String
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice"
    },
    orderId: {
      type: String,
      required: true,
      unique: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: "LKR"
    },
    items: {
      type: String,
      default: "Maintenance Payment"
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "canceled"],
      default: "pending"
    },
    payherePaymentId: {
      type: String
    },
    payhereStatus: {
      type: String
    },
    paymentMethod: {
      type: String
    },
    checkoutSnapshot: {
      type: Object,
      default: {}
    },
    rawNotify: {
      type: Object
    }
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
