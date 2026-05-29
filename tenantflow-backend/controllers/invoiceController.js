import Invoice from "../models/Invoice.js";
import Issue from "../models/Issue.js";
import { notifyInvoiceSent } from "../services/notificationService.js";

const buildInvoiceNumber = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TF-${random}`;
};

const formatBuildingLabel = (building) => {
  if (!building) return "—";
  if (typeof building === "string") return building;
  return building.name || building.address || "—";
};

const formatIssueLabel = (issue) => {
  if (!issue) return "Maintenance";
  const type = issue.issueType || "Maintenance";
  const spot = issue.specificSpot || issue.description || "";
  return spot ? `${type} - ${spot}` : type;
};

const serializeInvoice = (invoiceDoc) => {
  const invoice = typeof invoiceDoc?.toObject === "function" ? invoiceDoc.toObject() : { ...invoiceDoc };
  const issue = invoice.issue || {};
  const buildingLabel = formatBuildingLabel(invoice.location?.building || issue.building);
  const unitNumber = invoice.location?.unitNumber || issue.unitNumber || issue.unit || "—";
  const issueLabel = formatIssueLabel(issue);
  const taskId = issue._id?.toString?.() || invoice.issue?.toString?.() || invoice.issue || null;

  return {
    ...invoice,
    issue,
    taskId,
    taskName: issueLabel,
    issueLabel,
    relatedIssueLabel: issueLabel,
    locationLabel: `${buildingLabel}, Unit ${unitNumber}`,
    location: {
      ...invoice.location,
      building: buildingLabel,
      unitNumber
    }
  };
};

export const createInvoice = async (req, res) => {
  try {
    const {
      tenantId,
      issueId,
      issueTitle,
      laborCharge,
      partsCharge,
      dueDate,
      notes
    } = req.body;

    if (!tenantId || !issueTitle || laborCharge == null || partsCharge == null) {
      return res.status(400).json({ message: "Missing required invoice fields" });
    }

    let issue = null;
    if (issueId) {
      issue = await Issue.findById(issueId);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
    }

    const total = Number(laborCharge) + Number(partsCharge);

    const invoice = await Invoice.create({
      tenant: tenantId,
      issue: issueId,
      invoiceNumber: buildInvoiceNumber(),
      issueTitle,
      status: "submitted",
      laborCharge: Number(laborCharge),
      partsCharge: Number(partsCharge),
      total,
      dueDate,
      notes
    });

    if (issue) {
      issue.invoice = invoice._id;
      if (!issue.paymentAmount || issue.paymentAmount === 0) {
        issue.paymentAmount = total;
      }
      if (issue.status !== "invoice issued" && issue.status !== "payment pending") {
        issue.status = "invoice issued";
      }
      await issue.save();
    }

    return res.status(201).json({ invoice: serializeInvoice(invoice) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create invoice", error: error.message });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ tenant: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "issue",
        select: "issueType specificSpot description building unit unitNumber status",
        populate: [{ path: "building", select: "name address city" }]
      });

    return res.json({ count: invoices.length, invoices: invoices.map(serializeInvoice) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch invoices", error: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate({
      path: "issue",
      select: "issueType specificSpot description building unit unitNumber status",
      populate: [{ path: "building", select: "name address city" }]
    });
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.tenant.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view this invoice" });
    }

    return res.json({ invoice: serializeInvoice(invoice) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch invoice", error: error.message });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const { status, laborCharge, partsCharge, dueDate, notes } = req.body;

    if (status) invoice.status = status;
    if (laborCharge != null) invoice.laborCharge = Number(laborCharge);
    if (partsCharge != null) invoice.partsCharge = Number(partsCharge);
    if (laborCharge != null || partsCharge != null) {
      invoice.total = Number(invoice.laborCharge) + Number(invoice.partsCharge);
    }
    if (dueDate) invoice.dueDate = dueDate;
    if (notes != null) invoice.notes = notes;

    await invoice.save();

    if (String(invoice.status).toLowerCase() === "paid" && invoice.issue) {
      await Issue.updateOne(
        { _id: invoice.issue },
        { $set: { status: "payment successful" } }
      );
    }

    return res.json({ invoice: serializeInvoice(invoice) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update invoice", error: error.message });
  }
};

export const sendInvoiceToTenant = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("tenant", "name email")
      .populate({
        path: "issue",
        select: "issueType building unitNumber unit",
        populate: [{ path: "building", select: "name" }]
      });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only administrators can send invoices to tenants" });
    }

    if (invoice.status !== "draft") {
      return res.status(400).json({ message: "Invoice has already been sent to the tenant" });
    }

    invoice.status = "submitted";
    await invoice.save();

    if (invoice.issue) {
      await Issue.findByIdAndUpdate(invoice.issue._id || invoice.issue, {
        $set: {
          invoice: invoice._id,
          status: "invoice issued"
        }
      });
    }

    await notifyInvoiceSent(invoice._id, req.user._id);

    return res.json({
      message: "Invoice sent to tenant",
      invoice: serializeInvoice(invoice)
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to send invoice to tenant", error: error.message });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.issue) {
      await Issue.updateOne(
        { _id: invoice.issue, invoice: invoice._id },
        { $unset: { invoice: 1 } }
      );
    }

    await Invoice.deleteOne({ _id: req.params.id });
    return res.json({ message: "Invoice deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete invoice", error: error.message });
  }
};
