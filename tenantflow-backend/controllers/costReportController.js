import CostReport from "../models/CostReport.js";
import Issue from "../models/Issue.js";
import Invoice from "../models/Invoice.js";
import User from "../models/User.js";
import {
  notifyStatusChanged,
  createNotification
} from "../services/notificationService.js";

const getPopulatedId = (value) => value?._id?.toString?.() || value?.toString?.();

const appendCostReportAuditEntry = (costReport, entry) => {
  if (!costReport.auditTrail) {
    costReport.auditTrail = [];
  }

  costReport.auditTrail.push({
    taskId: costReport.issue,
    changedAt: new Date(),
    ...entry
  });
};

// @desc    Create a new cost report (draft)
// @route   POST /cost-reports
// @access  Private (Staff)
export const createCostReport = async (req, res) => {
  try {
    const { issueId } = req.body;

    // Verify issue exists and user is assigned to it
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const assignedStaffId = issue.assignedTo?.toString();
    if (assignedStaffId !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to create cost report for this issue" });
    }

    // Check if task is in completed status
    if (issue.status !== "completed") {
      return res.status(400).json({ message: "Cost report can only be created for completed tasks" });
    }

    // Check if a cost report already exists
    const existingReport = await CostReport.findOne({
      issue: issueId,
      status: { $in: ["draft", "submitted"] }
    });

    if (existingReport) {
      return res.status(400).json({ message: "A cost report for this issue already exists" });
    }

    // Create new cost report
    const costReport = await CostReport.create({
      issue: issueId,
      createdBy: req.user._id,
      costItems: [],
      totalCost: 0,
      status: "draft",
      auditTrail: [{
        event: "created",
        taskId: issueId,
        changedBy: req.user._id,
        summary: "Cost report created",
        newStatus: "draft",
        totalCost: 0,
        costItemCount: 0
      }]
    });

    await Issue.findByIdAndUpdate(issueId, {
      currentCostReport: costReport._id
    });

    return res.status(201).json({
      message: "Cost report created",
      costReport
    });

  } catch (error) {
    console.error("Create cost report error:", error);
    return res.status(500).json({ message: "Failed to create cost report", error: error.message });
  }
};

// @desc    Get cost report details
// @route   GET /cost-reports/:id
// @access  Private
export const getCostReportById = async (req, res) => {
  try {
    const costReport = await CostReport.findById(req.params.id)
      .populate({
        path: "issue",
        select: "issueType building floor unit unitNumber specificSpot description status urgency priority tenant assignedTo propertyManager createdAt updatedAt media specialArrangements statusHistory resolvedAt invoice currentCostReport",
        populate: [
          { path: "building", select: "name address city" },
          { path: "tenant", select: "name email phone" },
          { path: "assignedTo", select: "name staffType phone" },
          { path: "propertyManager", select: "name email" }
        ]
      })
      .populate("createdBy", "name email")
      .populate("approvedBy", "name email")
      .populate({
        path: "invoice",
        select: "invoiceNumber status total issuedAt dueDate notes paymentStatus paymentMethod costBreakdown laborCharge partsCharge issueTitle issueType tenant issue location sentToTenantAt"
      });

    if (!costReport) {
      return res.status(404).json({ message: "Cost report not found" });
    }

    // Check authorization
    const isStaff = costReport.createdBy._id.toString() === req.user._id.toString();
    const isManager = getPopulatedId(costReport.issue.propertyManager) === req.user._id.toString();

    if (req.user.role !== "admin" && !isStaff && !isManager) {
      return res.status(403).json({ message: "Not authorized to view this cost report" });
    }

    return res.json({ costReport });

  } catch (error) {
    console.error("Get cost report error:", error);
    return res.status(500).json({ message: "Failed to fetch cost report", error: error.message });
  }
};

// @desc    Get cost reports for an issue
// @route   GET /cost-reports/issue/:issueId
// @access  Private
export const getCostReportsByIssue = async (req, res) => {
  try {
    const { issueId } = req.params;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const costReports = await CostReport.find({ issue: issueId })
      .populate("createdBy", "name email")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });

    return res.json({ costReports });

  } catch (error) {
    console.error("Get cost reports error:", error);
    return res.status(500).json({ message: "Failed to fetch cost reports", error: error.message });
  }
};

// @desc    Update cost report items (staff can edit draft/rejected)
// @route   PUT /cost-reports/:id
// @access  Private (Staff)
export const updateCostReport = async (req, res) => {
  try {
    const costReport = await CostReport.findById(req.params.id);
    if (!costReport) {
      return res.status(404).json({ message: "Cost report not found" });
    }

    // Check authorization - only creator can edit
    if (costReport.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this cost report" });
    }

    // Can only edit draft or rejected reports
    if (!["draft", "rejected"].includes(costReport.status)) {
      return res.status(400).json({ 
        message: `Cannot edit cost report with status '${costReport.status}'` 
      });
    }

    const { costItems, notes } = req.body;

    // Validate cost items
    if (costItems && Array.isArray(costItems)) {
      let totalCost = 0;
      const breakdown = {
        laborCost: 0,
        materialsCost: 0,
        transportCost: 0,
        otherCost: 0
      };

      const validatedItems = costItems.map(item => {
          const normalizedCategory = item.category || "other";
          const quantity = Number(item.quantity || 1);
          const hours = Number(item.hours || 0);
          const rate = Number(item.rate || item.unitCost || 0);
          const unitCost = Number(item.unitCost || item.rate || 0);
          const laborCost = normalizedCategory === "labor" ? (hours > 0 && rate > 0 ? hours * rate : quantity * rate) : quantity * unitCost;
          const cost = Number(item.cost ?? laborCost);
        totalCost += cost;

        // Add to breakdown
          const category = normalizedCategory;
        if (breakdown[category + "Cost"] !== undefined) {
          breakdown[category + "Cost"] += cost;
        }

        return {
          itemName: item.itemName,
          description: item.description || "",
            quantity,
            hours,
            rate,
            unitCost,
          cost,
          category
        };
      });

      costReport.costItems = validatedItems;
      costReport.totalCost = totalCost;
      costReport.costBreakdown = breakdown;
    }

    if (notes !== undefined) {
      costReport.notes = notes;
    }

    await costReport.save();

    appendCostReportAuditEntry(costReport, {
      event: "updated",
      changedBy: req.user._id,
      previousStatus: costReport.status,
      newStatus: costReport.status,
      summary: "Cost report updated",
      totalCost: costReport.totalCost,
      costItemCount: costReport.costItems?.length || 0,
      revisionNumber: costReport.revisionNumber
    });

    await costReport.save();

    await Issue.findByIdAndUpdate(costReport.issue, {
      currentCostReport: costReport._id
    });

    return res.json({
      message: "Cost report updated",
      costReport
    });

  } catch (error) {
    console.error("Update cost report error:", error);
    return res.status(500).json({ message: "Failed to update cost report", error: error.message });
  }
};

// @desc    Submit cost report for approval
// @route   POST /cost-reports/:id/submit
// @access  Private (Staff)
export const submitCostReport = async (req, res) => {
  try {
    const costReport = await CostReport.findById(req.params.id)
      .populate({ path: "issue", populate: [{ path: "building", select: "name address city" }, { path: "tenant", select: "name email phone" }, { path: "assignedTo", select: "name staffType phone" }, { path: "propertyManager", select: "name email" }] })
      .populate("createdBy", "name email");

    if (!costReport) {
      return res.status(404).json({ message: "Cost report not found" });
    }

    // Check authorization
    if (costReport.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to submit this cost report" });
    }

    // Can only submit draft or rejected reports
    if (!["draft", "rejected"].includes(costReport.status)) {
      return res.status(400).json({ message: "Cannot submit cost report with this status" });
    }

    // Validate cost items exist
    if (!costReport.costItems || costReport.costItems.length === 0) {
      return res.status(400).json({ message: "Cost report must have at least one cost item" });
    }

    const wasRejected = costReport.status === "rejected";

    // If previously rejected, increment revision number
    if (wasRejected) {
      // Store previous version
      if (!costReport.previousVersions) costReport.previousVersions = [];
      costReport.previousVersions.push({
        revisionNumber: costReport.revisionNumber,
        costItems: costReport.costItems,
        totalCost: costReport.totalCost,
        submittedAt: costReport.submittedAt,
        rejectedAt: costReport.rejectedAt,
        rejectionRemarks: costReport.rejectionRemarks
      });
      
      costReport.revisionNumber += 1;
      costReport.rejectionRemarks = "";
      costReport.rejectedAt = null;
    }

    costReport.status = "submitted";
    costReport.submittedAt = new Date();
    await costReport.save();

    appendCostReportAuditEntry(costReport, {
      event: wasRejected ? "resubmitted" : "submitted",
      changedBy: req.user._id,
      previousStatus: wasRejected ? "rejected" : "draft",
      newStatus: "submitted",
      summary: wasRejected ? "Cost report resubmitted after rejection" : "Cost report submitted for approval",
      totalCost: costReport.totalCost,
      costItemCount: costReport.costItems?.length || 0,
      revisionNumber: costReport.revisionNumber
    });

    await costReport.save();

    // Update issue status
    const issue = await Issue.findByIdAndUpdate(
      costReport.issue._id,
      {
        status: "cost report submitted",
        currentCostReport: costReport._id,
        costReportRequired: true,
        costReportCreatedAt: costReport.submittedAt
      },
      { new: true }
    ).populate("propertyManager", "name email");

    // Add to status history
    await Issue.findByIdAndUpdate(
      costReport.issue._id,
      {
        $push: {
          statusHistory: {
            status: "cost report submitted",
            changedBy: req.user._id,
            changedAt: new Date(),
            reason: "Staff submitted cost report for approval"
          }
        }
      }
    );

    // Notify property manager about submitted cost report
    await createNotification(issue.propertyManager._id, {
      type: "task_status_changed",
      issue: costReport.issue._id,
      title: "Cost Report Submitted",
      message: `${costReport.createdBy.name} submitted a cost report for approval. Total cost: LKR ${costReport.totalCost.toFixed(2)}`,
      data: {
        newStatus: "cost report submitted",
        issueType: costReport.issue.issueType,
        unitNumber: costReport.issue.unitNumber,
        totalCost: costReport.totalCost
      },
      actionUrl: `/admin/cost-reports/${costReport._id}`
    });

    return res.json({
      message: "Cost report submitted for approval",
      costReport,
      issue
    });

  } catch (error) {
    console.error("Submit cost report error:", error);
    return res.status(500).json({ message: "Failed to submit cost report", error: error.message });
  }
};

// @desc    Approve cost report (manager)
// @route   POST /cost-reports/:id/approve
// @access  Private (Admin/Manager)
export const approveCostReport = async (req, res) => {
  try {
    const costReport = await CostReport.findById(req.params.id)
      .populate({ path: "issue", populate: [{ path: "building", select: "name address city" }, { path: "tenant", select: "name email phone" }, { path: "assignedTo", select: "name staffType phone" }, { path: "propertyManager", select: "name email" }] })
      .populate("createdBy", "name email");

    if (!costReport) {
      return res.status(404).json({ message: "Cost report not found" });
    }

    // Check authorization - admins and the assigned property manager can approve
    const propertyManagerId = getPopulatedId(costReport.issue.propertyManager);
    if (req.user.role !== "admin" && propertyManagerId !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to approve this cost report" });
    }

    if (costReport.status !== "submitted") {
      return res.status(400).json({ message: "Can only approve submitted cost reports" });
    }

    // Approve the report
    costReport.status = "approved";
    costReport.approvedBy = req.user._id;
    costReport.approvedAt = new Date();
    appendCostReportAuditEntry(costReport, {
      event: "approved",
      changedBy: req.user._id,
      previousStatus: "submitted",
      newStatus: "approved",
      summary: "Cost report approved",
      totalCost: costReport.totalCost,
      costItemCount: costReport.costItems?.length || 0,
      revisionNumber: costReport.revisionNumber
    });
    await costReport.save();

    // Create invoice from cost report
    const invoiceNumber = `INV-${Date.now()}`;
    const invoice = await Invoice.create({
      tenant: costReport.issue.tenant,
      issue: costReport.issue._id,
      costReport: costReport._id,
      propertyManager: req.user._id,
      invoiceNumber,
      issueTitle: `${costReport.issue.issueType} - Cost Invoice`,
      issueType: costReport.issue.issueType,
      status: "draft",
      location: {
        building: costReport.issue.building?.name || costReport.issue.building,
        unitNumber: costReport.issue.unitNumber
      },
      costBreakdown: costReport.costBreakdown,
      total: costReport.totalCost,
      paymentStatus: "pending",
      paymentMethod: "payhere"
    });

    // Update cost report with invoice reference
    costReport.invoice = invoice._id;
    await costReport.save();

    // Update issue status to "invoice issued" and link invoice
    const updatedIssue = await Issue.findByIdAndUpdate(
      costReport.issue._id,
      {
        status: "invoice issued",
        invoice: invoice._id,
        paymentAmount: costReport.totalCost,
        currentCostReport: costReport._id
      },
      { new: true }
    ).populate("tenant", "name email");

    // Add to status history
    await Issue.findByIdAndUpdate(
      costReport.issue._id,
      {
        $push: {
          statusHistory: {
            status: "invoice issued",
            changedBy: req.user._id,
            changedAt: new Date(),
            reason: "Cost report approved - invoice generated"
          }
        }
      }
    );

    // Notify staff member of approval
    await createNotification(costReport.createdBy._id, {
      type: "task_status_changed",
      issue: costReport.issue._id,
      title: "Cost Report Approved",
      message: `Your cost report has been approved. Invoice generated for LKR ${costReport.totalCost.toFixed(2)} and saved as a draft for the property manager.`,
      data: {
        newStatus: "invoice issued",
        totalCost: costReport.totalCost
      },
      actionUrl: `/staff/tasks/${costReport.issue._id}`
    });

    return res.json({
      message: "Cost report approved and invoice created",
      costReport,
      invoice
    });

  } catch (error) {
    console.error("Approve cost report error:", error);
    return res.status(500).json({ message: "Failed to approve cost report", error: error.message });
  }
};

// @desc    Reject cost report with remarks (manager)
// @route   POST /cost-reports/:id/reject
// @access  Private (Admin/Manager)
export const rejectCostReport = async (req, res) => {
  try {
    const { remarks } = req.body;

    if (!remarks || remarks.trim() === "") {
      return res.status(400).json({ message: "Rejection remarks are required" });
    }

    const costReport = await CostReport.findById(req.params.id)
      .populate({ path: "issue", populate: [{ path: "building", select: "name address city" }, { path: "tenant", select: "name email phone" }, { path: "assignedTo", select: "name staffType phone" }, { path: "propertyManager", select: "name email" }] })
      .populate("createdBy", "name email");

    if (!costReport) {
      return res.status(404).json({ message: "Cost report not found" });
    }

    // Check authorization - admins and the assigned property manager can reject
    const propertyManagerId = getPopulatedId(costReport.issue.propertyManager);
    if (req.user.role !== "admin" && propertyManagerId !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to reject this cost report" });
    }

    if (costReport.status !== "submitted") {
      return res.status(400).json({ message: "Can only reject submitted cost reports" });
    }

    // Reject the report
    costReport.status = "rejected";
    costReport.rejectionRemarks = remarks;
    costReport.rejectedAt = new Date();
    appendCostReportAuditEntry(costReport, {
      event: "rejected",
      changedBy: req.user._id,
      previousStatus: "submitted",
      newStatus: "rejected",
      remarks,
      summary: `Cost report rejected: ${remarks}`,
      totalCost: costReport.totalCost,
      costItemCount: costReport.costItems?.length || 0,
      revisionNumber: costReport.revisionNumber
    });
    await costReport.save();

    // Update issue status
    const updatedIssue = await Issue.findByIdAndUpdate(
      costReport.issue._id,
      { status: "cost report rejected" },
      { new: true }
    );

    // Add to status history
    await Issue.findByIdAndUpdate(
      costReport.issue._id,
      {
        $push: {
          statusHistory: {
            status: "cost report rejected",
            changedBy: req.user._id,
            changedAt: new Date(),
            reason: `Cost report rejected: ${remarks}`
          }
        }
      }
    );

    // Notify staff member of rejection
    await createNotification(costReport.createdBy._id, {
      type: "task_status_changed",
      issue: costReport.issue._id,
      title: "Cost Report Rejected",
      message: `Your cost report was rejected. Reason: ${remarks}. Please review and resubmit.`,
      data: {
        newStatus: "cost report rejected",
        rejectionRemarks: remarks
      },
      actionUrl: `/staff/tasks/${costReport.issue._id}`
    });

    return res.json({
      message: "Cost report rejected",
      costReport
    });

  } catch (error) {
    console.error("Reject cost report error:", error);
    return res.status(500).json({ message: "Failed to reject cost report", error: error.message });
  }
};

// @desc    Get cost reports for manager review history
// @route   GET /cost-reports/manager/pending
// @access  Private (Admin/Manager)
export const getPendingCostReports = async (req, res) => {
  try {
    // Keep submitted, approved, and rejected reports visible in the manager dashboard
    const costReports = await CostReport.find({
      status: { $in: ["submitted", "approved", "rejected"] }
    })
      .populate({
        path: "issue",
        select: "issueType building floor unit unitNumber specificSpot priority propertyManager",
        populate: [{ path: "building", select: "name address city" }, { path: "propertyManager", select: "name email" }]
      })
      .populate("createdBy", "name email")
      .sort({ updatedAt: -1, submittedAt: -1 });

    const visibleReports = costReports.filter((report) => {
      const propertyManagerId = report.issue?.propertyManager?._id?.toString?.() || report.issue?.propertyManager?.toString?.();
      return propertyManagerId === req.user._id.toString();
    });

    return res.json({ costReports: visibleReports });

  } catch (error) {
    console.error("Get pending cost reports error:", error);
    return res.status(500).json({ message: "Failed to fetch pending cost reports", error: error.message });
  }
};
