import crypto from "crypto";
import Payment from "../models/Payment.js";
import Invoice from "../models/Invoice.js";
import mongoose from "mongoose";
import paymentService from "../services/paymentService.js";
import verifyPayHereHash from "../utils/verifyPayHereHash.js";

const mapPayHereStatus = (statusCode) => {
  switch (String(statusCode)) {
    case "2":
      return "paid";
    case "0":
      return "pending";
    case "-1":
      return "canceled";
    case "-2":
      return "failed";
    default:
      return "failed";
  }
};

// Initiate PayHere payment
export const initiatePayment = async (req, res) => {
  try {
    const { amount, items, customer, invoiceId } = req.body;

    if (!amount || !customer?.firstName || !customer?.lastName || !customer?.email || !customer?.phone) {
      return res.status(400).json({ message: "Amount and customer details are required" });
    }

    const orderId = `TF-${crypto.randomUUID()}`;

    let invoice = null;
    if (invoiceId && mongoose.Types.ObjectId.isValid(invoiceId)) {
      invoice = await Invoice.findOne({ _id: invoiceId, tenant: req.user._id });
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
    }

    const payment = await Payment.create({
      tenant: req.user._id,
      invoice: invoice ? invoice._id : undefined,
      orderId,
      amount,
      items
    });

    const payhere = paymentService.buildPayHerePayload({
      orderId,
      amount,
      items,
      customer
    });

    return res.status(201).json({
      message: "Payment initiated",
      payment,
      payhere
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to initiate payment", error: error.message });
  }
};

// Verify payment by order ID
export const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({ orderId, tenant: req.user._id });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.json({ payment });
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify payment", error: error.message });
  }
};

// PayHere notify callback (no auth)
export const handlePaymentNotify = async (req, res) => {
  try {
    const data = req.body || {};
    const hash = data.md5sig;

    if (!data.order_id || !hash) {
      return res.status(400).send("Invalid notification");
    }

    const isValid = verifyPayHereHash(data, hash);
    if (!isValid) {
      return res.status(400).send("Invalid hash");
    }

    const payment = await Payment.findOne({ orderId: data.order_id });
    if (!payment) {
      return res.status(404).send("Payment not found");
    }

    payment.status = mapPayHereStatus(data.status_code);
    payment.payherePaymentId = data.payment_id || payment.payherePaymentId;
    payment.payhereStatus = data.status_code;
    payment.paymentMethod = data.method || payment.paymentMethod;
    payment.rawNotify = data;

    await payment.save();

    if (payment.status === "paid" && payment.invoice) {
      await Invoice.updateOne(
        { _id: payment.invoice },
        { $set: { status: "paid" } }
      );
    }

    return res.status(200).send("OK");
  } catch (error) {
    return res.status(500).send("Server error");
  }
};

// Get payments for current user
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ tenant: req.user._id }).sort({ createdAt: -1 });
    return res.json({ count: payments.length, payments });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch payments", error: error.message });
  }
};

// Delete payment for current user
export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findOne({ _id: id, tenant: req.user._id });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    await payment.deleteOne();

    return res.json({ message: "Payment deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete payment", error: error.message });
  }
};
