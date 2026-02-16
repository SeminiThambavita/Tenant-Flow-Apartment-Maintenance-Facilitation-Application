import Invoice from "../models/Invoice.js";

const buildInvoiceNumber = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TF-${random}`;
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

    const total = Number(laborCharge) + Number(partsCharge);

    const invoice = await Invoice.create({
      tenant: tenantId,
      issue: issueId,
      invoiceNumber: buildInvoiceNumber(),
      issueTitle,
      laborCharge: Number(laborCharge),
      partsCharge: Number(partsCharge),
      total,
      dueDate,
      notes
    });

    return res.status(201).json({ invoice });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create invoice", error: error.message });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ tenant: req.user._id })
      .sort({ createdAt: -1 })
      .populate("issue", "issueType status");

    return res.json({ count: invoices.length, invoices });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch invoices", error: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("issue", "issueType status");
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this invoice" });
    }

    return res.json({ invoice });
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

    return res.json({ invoice });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update invoice", error: error.message });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    await Invoice.deleteOne({ _id: req.params.id });
    return res.json({ message: "Invoice deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete invoice", error: error.message });
  }
};
