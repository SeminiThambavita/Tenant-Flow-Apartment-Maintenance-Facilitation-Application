import Issue from "../models/Issue.js";
import User from "../models/User.js";
import Building from "../models/Building.js";
import {
  notifyIssueReported,
  notifyTaskAssigned,
  notifyStatusChanged,
  notifyCostReportRequired
} from "../services/notificationService.js";

const normalizeStatus = (value) => String(value || "").trim().toLowerCase();

const statusAliasMap = {
  pending: "new",
  "in-progress": "in progress",
  completed: "completed",
  new: "new",
  assigned: "assigned",
  "in progress": "in progress",
  "tenant confirmed": "tenant confirmed",
  "cost report submitted": "cost report submitted",
  "cost report rejected": "cost report rejected",
  "invoice issued": "invoice issued",
  "payment pending": "payment pending",
  "payment done": "payment done",
  "task done": "task done",
  "done and payment pending": "done and payment pending",
  "payment successful": "payment done"
};

const getAssignedStaffId = (issue) => {
  if (!issue?.assignedTo) return null;
  return issue.assignedTo._id?.toString() || issue.assignedTo.toString();
};

// @desc    Create new issue
// @route   POST /issues
// @access  Private (Tenant)
export const createIssue = async (req, res) => {
  try {
    const { issueType, specificSpot, description, urgency, specialArrangements } = req.body;
    
    // Get tenant's building and location info
    const tenantBuilding = req.user.building;
    const tenantFloor = req.user.floor;
    const tenantUnit = req.user.unit;

    // Validate mandatory fields
    if (!issueType || !specificSpot) {
      return res.status(400).json({ 
        message: "Issue type and specific spot are required" 
      });
    }

    if (!tenantBuilding) {
      return res.status(400).json({
        message: "Your building information is not set. Please update your profile with the correct building."
      });
    }

    if (tenantFloor === undefined || tenantFloor === null) {
      return res.status(400).json({
        message: "Your floor information is not set. Please update your profile."
      });
    }

    if (!tenantUnit) {
      return res.status(400).json({
        message: "Your unit information is not set. Please update your profile."
      });
    }

    // Verify building exists
    let building;
    if (typeof tenantBuilding === 'object' && tenantBuilding._id) {
      // Building is already populated
      building = tenantBuilding;
    } else {
      // Building is just an ObjectId string
      building = await Building.findById(tenantBuilding);
    }
    
    if (!building) {
      return res.status(404).json({
        message: "Your assigned building no longer exists. Please contact support."
      });
    }

    // Process uploaded files
    const media = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const fileType = file.mimetype.startsWith("image/") ? "image" : 
                        file.mimetype.startsWith("video/") ? "video" :
                        file.mimetype.startsWith("audio/") ? "audio" : "media";
        media.push({
          url: `/uploads/${file.filename}`,
          type: fileType,
          filename: file.originalname
        });
      });
    }

    let parsedSpecialArrangements = {
      specialAccess: false,
      petsInUnit: false,
      callBeforeArriving: false,
    };

    if (specialArrangements) {
      try {
        const parsed = typeof specialArrangements === 'string' ? JSON.parse(specialArrangements) : specialArrangements;
        parsedSpecialArrangements = {
          specialAccess: Boolean(parsed?.specialAccess),
          petsInUnit: Boolean(parsed?.petsInUnit),
          callBeforeArriving: Boolean(parsed?.callBeforeArriving),
        };
      } catch {
        parsedSpecialArrangements = {
          specialAccess: false,
          petsInUnit: false,
          callBeforeArriving: false,
        };
      }
    }

    // Create issue with building reference
    // Extract ObjectId if building is a populated object
    const buildingId = typeof building === 'object' && building._id ? building._id : building;
    
    const issue = await Issue.create({
      tenant: req.user._id,
      issueType,
      building: buildingId,
      floor: tenantFloor,
      unit: tenantUnit,
      specificSpot,
      description: description || "",
      urgency: ["urgent", "standard", "low"].includes(String(urgency).toLowerCase()) ? String(urgency).toLowerCase() : "standard",
      specialArrangements: parsedSpecialArrangements,
      media,
      status: "new",
      priority: (() => {
        const u = String(urgency || "").toLowerCase();
        if (u === "urgent") return "high";
        if (u === "low") return "low";
        return "medium"; // standard → medium
      })(),
      statusHistory: [{
        status: "new",
        changedBy: req.user._id,
        changedAt: new Date(),
        reason: "Issue initially reported"
      }]
    });

    // Assign to the building's property manager
    if (building.propertyManagers && building.propertyManagers.length > 0) {
      issue.propertyManager = building.propertyManagers[0];
      await issue.save();
      
      // Notify the property manager about the new issue
      const propertyManager = await User.findById(building.propertyManagers[0]);
      if (propertyManager) {
        await notifyIssueReported(issue, propertyManager._id);
      }
    }

    return res.status(201).json({
      message: "Issue reported successfully",
      issue
    });

  } catch (error) {
    console.error("Create issue error:", error);
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        message: "Validation error", 
        details: messages,
        error: error.message 
      });
    }
    
    return res.status(500).json({ 
      message: "Failed to create issue", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get all issues for logged-in tenant
// @route   GET /issues
// @access  Private (Tenant)
export const getIssues = async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};

    if (req.user.role === "tenant") {
      query.tenant = req.user._id;
    } else if (req.user.role === "staff") {
      query.assignedTo = req.user._id;
    }
    
    // Filter by status if provided
    if (status && status !== "all") {
      const mappedStatus = statusAliasMap[normalizeStatus(status)];
      if (mappedStatus) {
        query.status = mappedStatus;
      }
    }

    const issues = await Issue.find(query)
      .populate("tenant", "name email apartmentNumber")
      .populate("assignedTo", "name staffType")
      .populate({
        path: "currentCostReport",
        select: "status totalCost notes costItems revisionNumber createdAt updatedAt"
      })
      .populate("building", "name address city")
      .sort({ createdAt: -1 });

    return res.json({
      count: issues.length,
      issues
    });

  } catch (error) {
    console.error("Get issues error:", error);
    return res.status(500).json({ message: "Failed to fetch issues", error: error.message });
  }
};

// @desc    Get single issue by ID
// @route   GET /issues/:id
// @access  Private (Tenant/Staff/Admin)
export const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate("tenant", "name email phone apartmentNumber floorNumber")
      .populate("assignedTo", "name staffType phone")
      .populate("building", "name address city");

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (req.user.role === "tenant" && issue.tenant._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this issue" });
    }

    const assignedStaffId = getAssignedStaffId(issue);
    if (req.user.role === "staff" && assignedStaffId !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this issue" });
    }

    return res.json({ issue });

  } catch (error) {
    console.error("Get issue by ID error:", error);
    return res.status(500).json({ message: "Failed to fetch issue", error: error.message });
  }
};

// @desc    Update issue
// @route   PUT /issues/:id
// @access  Private (Staff/Admin)
export const updateIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate("tenant", "name email apartmentNumber")
      .populate("assignedTo", "name staffType")
      .populate("propertyManager", "name");

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const { status, priority, assignedTo, resolutionNotes, scheduledStartDate, scheduledStartTime } = req.body;
    const assignedStaffId = getAssignedStaffId(issue);
    const previousStatus = issue.status;
    let statusChanged = false;

    // ADMIN: Can assign tasks and manage everything
    if (req.user.role === "admin") {
      // Handle task assignment
      if (assignedTo !== undefined) {
        const oldAssignedId = assignedStaffId;
        issue.assignedTo = assignedTo || null;
        
        // Auto-change status from "new" to "assigned" when assigning a staff member
        if (assignedTo && issue.status === "new") {
          issue.status = "assigned";
          statusChanged = true;
          
          // Add to status history
          if (!issue.statusHistory) issue.statusHistory = [];
          issue.statusHistory.push({
            status: "assigned",
            changedBy: req.user._id,
            changedAt: new Date(),
            reason: "Task assigned to staff member"
          });

          // Notify all parties about the assignment
          await notifyTaskAssigned(issue, assignedTo, req.user._id);
        }
        // If unassigning, revert to "new" status
        else if (!assignedTo && (issue.status === "assigned" || issue.status === "in progress")) {
          issue.status = "new";
          statusChanged = true;
          if (!issue.statusHistory) issue.statusHistory = [];
          issue.statusHistory.push({
            status: "new",
            changedBy: req.user._id,
            changedAt: new Date(),
            reason: "Task unassigned"
          });
        }
      }

      // Handle manual status updates
      if (status) {
        const mappedStatus = statusAliasMap[normalizeStatus(status)];
        if (!mappedStatus) {
          return res.status(400).json({ message: "Invalid status value" });
        }
        if (mappedStatus !== issue.status) {
          const oldStatus = issue.status;
          issue.status = mappedStatus;
          statusChanged = true;
          
          if (!issue.statusHistory) issue.statusHistory = [];
          issue.statusHistory.push({
            status: mappedStatus,
            changedBy: req.user._id,
            changedAt: new Date(),
            reason: "Admin status update"
          });

          // Notify about status change
          if (statusChanged && issue.assignedTo) {
            await notifyStatusChanged(
              issue,
              oldStatus,
              mappedStatus,
              issue.propertyManager?._id || req.user._id
            );
          }
        }
      }

      if (priority) issue.priority = priority;
      if (resolutionNotes !== undefined) issue.resolutionNotes = resolutionNotes;
      if (scheduledStartDate !== undefined) {
        issue.scheduledStartDate = scheduledStartDate ? new Date(scheduledStartDate) : null;
        issue.startDateReminderSent = false; // reset reminder flag if date changes
      }
      if (scheduledStartTime !== undefined) {
        issue.scheduledStartTime = scheduledStartTime || null;
      }

      if (issue.status === "completed" && !issue.resolvedAt) {
        issue.resolvedAt = new Date();
        issue.costReportRequired = true;
      }

    } 
    // STAFF: Can only change status from new->in progress->completed
    else if (req.user.role === "staff") {
      if (assignedStaffId !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to update this issue" });
      }

      if (status) {
        const mappedStatus = statusAliasMap[normalizeStatus(status)];
        if (!mappedStatus) {
          return res.status(400).json({ message: "Invalid status value" });
        }

        // Only allow specific transitions for staff
        const currentStatus = issue.status;
        const validTransitions = {
          "assigned": ["in progress"],
          "new": ["in progress"],
          "tenant confirmed": ["completed"]   // staff can only mark complete after tenant confirms
        };

        const allowedTransitions = validTransitions[currentStatus] || [];
        if (!allowedTransitions.includes(mappedStatus)) {
          return res.status(400).json({
            message: `Cannot change status from '${currentStatus}' to '${mappedStatus}'. Allowed transitions: ${allowedTransitions.join(", ")}`
          });
        }

        issue.status = mappedStatus;
        statusChanged = true;

        if (!issue.statusHistory) issue.statusHistory = [];
        issue.statusHistory.push({
          status: mappedStatus,
          changedBy: req.user._id,
          changedAt: new Date(),
          reason: `Staff updated status to ${mappedStatus}`
        });

        if (mappedStatus === "completed") {
          issue.resolvedAt = new Date();
          issue.costReportRequired = true;
          
          // Notify about cost report requirement
          await notifyCostReportRequired(issue, req.user._id);
        }

        // Notify all parties about status change
        await notifyStatusChanged(
          issue,
          previousStatus,
          mappedStatus,
          issue.propertyManager?._id
        );
      }

      if (resolutionNotes !== undefined) {
        issue.resolutionNotes = resolutionNotes;
      }
    }
    // TENANT: Can only confirm task completion (in progress → tenant confirmed)
    else if (req.user.role === "tenant") {
      // Verify this issue belongs to the requesting tenant
      const tenantId = issue.tenant?._id?.toString() || issue.tenant?.toString();
      if (tenantId !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to update this issue" });
      }

      if (status) {
        const mappedStatus = statusAliasMap[normalizeStatus(status)];
        if (mappedStatus !== "tenant confirmed") {
          return res.status(403).json({ message: "Tenants can only confirm task completion" });
        }
        if (issue.status !== "in progress") {
          return res.status(400).json({
            message: `Cannot confirm — task is currently '${issue.status}', not 'in progress'`
          });
        }

        issue.status = "tenant confirmed";
        statusChanged = true;

        if (!issue.statusHistory) issue.statusHistory = [];
        issue.statusHistory.push({
          status: "tenant confirmed",
          changedBy: req.user._id,
          changedAt: new Date(),
          reason: "Tenant confirmed task completion"
        });

        // Notify assigned staff and manager
        await notifyStatusChanged(
          issue,
          previousStatus,
          "tenant confirmed",
          issue.propertyManager?._id
        );
      }
    } else {
      return res.status(403).json({ message: "Not authorized to update this issue" });
    }

    await issue.save();

    const updatedIssue = await Issue.findById(issue._id)
      .populate("tenant", "name email apartmentNumber phone")
      .populate("assignedTo", "name staffType phone")
      .populate("propertyManager", "name email");

    return res.json({
      message: "Issue updated successfully",
      issue: updatedIssue,
      statusChanged,
      costReportRequired: issue.costReportRequired && issue.status === "completed"
    });

  } catch (error) {
    console.error("Update issue error:", error);
    return res.status(500).json({ message: "Failed to update issue", error: error.message });
  }
};

// @desc    Delete issue
// @route   DELETE /issues/:id
// @access  Private (Admin)
export const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    await Issue.deleteOne({ _id: req.params.id });

    return res.json({ message: "Issue deleted successfully" });

  } catch (error) {
    console.error("Delete issue error:", error);
    return res.status(500).json({ message: "Failed to delete issue", error: error.message });
  }
};
