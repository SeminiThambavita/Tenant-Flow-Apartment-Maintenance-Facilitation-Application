import crypto from "crypto";
import Payment from "../models/Payment.js";
import Invoice from "../models/Invoice.js";
import Issue from "../models/Issue.js";
import Task from "../models/Task.js";
import mongoose from "mongoose";
import paymentService from "../services/paymentService.js";
import { notifyPaymentReceived } from "../services/notificationService.js";
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
    const { amount, items, invoiceId } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ message: "Invoice ID is required" });
    }

    const nameParts = String(req.user?.name || "Tenant User").trim().split(" ").filter(Boolean);
    const firstName = nameParts[0] || "Tenant";
    const lastName = nameParts.slice(1).join(" ") || "User";

    const customer = {
      firstName,
      lastName,
      email: req.user?.email,
      phone: req.user?.phone,
      address: req.user?.unitNumber || req.user?.apartmentNumber || "N/A",
      city: "Colombo",
      country: "Sri Lanka"
    };

    if (!customer.email || !customer.phone) {
      return res.status(400).json({ message: "Tenant profile must include email and phone" });
    }

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, tenant: req.user._id }).populate({
      path: "issue",
      select: "issueType specificSpot description building unitNumber unit tenant assignedTo status"
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const issueLabel = invoice.issue
      ? `${invoice.issue.issueType || "Maintenance"}${invoice.issue.specificSpot || invoice.issue.description ? ` - ${invoice.issue.specificSpot || invoice.issue.description}` : ""}`
      : invoice.issueTitle || "Maintenance Payment";
    const taskId = invoice.taskId || invoice.issue?._id?.toString?.() || invoice.issue?._id || invoice.issue?.toString?.() || invoice.issue || null;
    const taskName = invoice.taskName || issueLabel;
    const checkoutAmount = Number(amount ?? invoice.total ?? 0);
    const orderId = `TF-${crypto.randomUUID()}`;

    const checkoutItems = items || invoice.invoiceNumber || invoice.issueTitle || "Maintenance Payment";

    const payhere = paymentService.buildPayHerePayload({
      orderId,
      amount: checkoutAmount,
      items: checkoutItems,
      customer,
      customFields: {
        custom_1: invoice.invoiceNumber || "",
        custom_2: String(taskId || ""),
        custom_3: String(req.user._id)
      }
    });

    const payment = await Payment.create({
      tenant: req.user._id,
      invoice: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      taskId,
      taskName,
      tenantName: req.user?.name || customer.firstName,
      tenantEmail: req.user?.email || customer.email,
      tenantPhone: req.user?.phone || customer.phone,
      tenantUnit: req.user?.unitNumber || req.user?.apartmentNumber || customer.address,
      orderId,
      amount: checkoutAmount,
      items: checkoutItems,
      checkoutSnapshot: {
        orderId,
        amount: checkoutAmount,
        items: checkoutItems,
        customer,
        payhere
      }
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
      const invoice = await Invoice.findOneAndUpdate(
        { _id: payment.invoice },
        {
          $set: {
            status: "paid",
            paymentStatus: "completed",
            paymentMethod: payment.paymentMethod || "payhere",
            paymentReference: data.payment_id || payment.orderId,
            paidAt: new Date()
          }
        },
        { new: true }
      ).select("issue");

      if (invoice?.issue) {
        await Issue.updateOne(
          { _id: invoice.issue },
          {
            $set: {
              status: "payment done",
              paymentStatus: "completed",
              paymentCompletedAt: new Date(),
              paymentAmount: payment.amount,
              paymentReference: data.payment_id || payment.orderId
            }
          }
        );
      }

      await notifyPaymentReceived(payment.invoice, payment);
    }

    return res.status(200).send("OK");
  } catch (error) {
    return res.status(500).send("Server error");
  }
};

// Get payments for current user
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ tenant: req.user._id })
      .populate({
        path: "invoice",
        select: "invoiceNumber issueTitle total status issuedAt dueDate paymentStatus paymentMethod paymentReference paidAt issue tenant taskId taskName location",
        populate: [
          { path: "issue", select: "issueType specificSpot building unit unitNumber assignedTo propertyManager status paymentStatus paymentReference", populate: [{ path: "assignedTo", select: "name email staffType" }, { path: "propertyManager", select: "name email" }, { path: "building", select: "name" }] },
          { path: "tenant", select: "name email phone apartmentNumber unitNumber" }
        ]
      })
      .sort({ createdAt: -1 });
    return res.json({ count: payments.length, payments });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch payments", error: error.message });
  }
};

// Get tenant payments for admin/property manager
export const getTenantPayments = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view tenant payments" });
    }

    const payments = await Payment.find({})
      .populate({
        path: "invoice",
        select: "invoiceNumber issueTitle total status issuedAt dueDate paymentStatus paymentMethod paymentReference paidAt issue tenant taskId taskName location",
        populate: [
          {
            path: "issue",
            select: "issueType specificSpot building unit unitNumber assignedTo propertyManager status paymentStatus paymentReference",
            populate: [
              { path: "assignedTo", select: "name email staffType" },
              { path: "propertyManager", select: "name email" },
              { path: "building", select: "name" }
            ]
          },
          { path: "tenant", select: "name email phone apartmentNumber unitNumber" }
        ]
      })
      .populate("tenant", "name email phone apartmentNumber unitNumber")
      .sort({ createdAt: -1 });

    const visiblePayments = payments.filter((payment) => {
      const invoice = payment.invoice || {};
      const issue = invoice.issue || {};
      const paymentStatus = String(payment.status || '').toLowerCase();
      const invoiceStatus = String(invoice.paymentStatus || invoice.status || '').toLowerCase();
      const issueStatus = String(issue.status || issue.paymentStatus || '').toLowerCase();

      return (
        paymentStatus === "paid" ||
        invoiceStatus === "completed" ||
        invoiceStatus === "paid" ||
        issueStatus === "payment done" ||
        issueStatus === "task done"
      );
    });

    return res.json({ count: visiblePayments.length, payments: visiblePayments });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch tenant payments", error: error.message });
  }
};

// Get payments for the logged-in staff member's assigned tasks
export const getStaffPayments = async (req, res) => {
  try {
    if (req.user.role !== "staff") {
      return res.status(403).json({ message: "Not authorized to view staff payments" });
    }

    const [assignedTasks, assignedIssues] = await Promise.all([
      Task.find({ assignedTo: req.user._id }).select("issue assignedTo"),
      Issue.find({ assignedTo: req.user._id }).select("_id")
    ]);

    const assignedIssueIds = new Set([
      ...assignedTasks.map((task) => task.issue?._id?.toString?.() || task.issue?.toString?.()).filter(Boolean),
      ...assignedIssues.map((issue) => issue._id?.toString?.()).filter(Boolean)
    ]);

    const payments = await Payment.find({ status: "paid" })
      .populate({
        path: "invoice",
        select: "invoiceNumber issueTitle total status issuedAt dueDate paymentStatus paymentMethod paymentReference paidAt issue tenant taskId taskName location",
        populate: [
          {
            path: "issue",
            select: "issueType specificSpot building unit unitNumber assignedTo propertyManager status paymentStatus paymentReference",
            populate: [
              { path: "assignedTo", select: "name email staffType" },
              { path: "propertyManager", select: "name email" },
              { path: "building", select: "name" }
            ]
          },
          { path: "tenant", select: "name email phone apartmentNumber unitNumber" }
        ]
      })
      .populate("tenant", "name email phone apartmentNumber unitNumber")
      .sort({ createdAt: -1 });

    const visiblePayments = payments.filter((payment) => {
      const invoice = payment.invoice || {};
      const issue = invoice.issue || {};
      const issueId = issue._id?.toString?.() || invoice.issue?.toString?.();
      const paymentIssueId = payment.taskId?.toString?.() || payment.taskId || invoice.taskId?.toString?.() || invoice.taskId;
      const paymentStatus = String(payment.status || '').toLowerCase();
      const invoiceStatus = String(invoice.paymentStatus || invoice.status || '').toLowerCase();
      const issueStatus = String(issue.status || issue.paymentStatus || '').toLowerCase();

      return (
        (assignedIssueIds.has(issueId) || assignedIssueIds.has(paymentIssueId?.toString?.())) &&
        (paymentStatus === "paid" || invoiceStatus === "completed" || invoiceStatus === "paid" || issueStatus === "payment done" || issueStatus === "task done")
      );
    });

    return res.json({ count: visiblePayments.length, payments: visiblePayments });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch staff payments", error: error.message });
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
