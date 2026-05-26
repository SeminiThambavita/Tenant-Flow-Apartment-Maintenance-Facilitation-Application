import Issue from "../models/Issue.js";

const normalizeStatus = (value) => String(value || "").trim().toLowerCase();

const statusAliasMap = {
  pending: "new",
  "in-progress": "in progress",
  completed: "completed",
  new: "new",
  assigned: "assigned",
  "in progress": "in progress",
  "done and payment pending": "done and payment pending",
  "payment successful": "payment successful"
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
    const { issueType, specificSpot, description } = req.body;
    const tenantBuilding = req.user.buildingName;
    const tenantUnit = req.user.unitNumber || req.user.apartmentNumber;

    // Validate mandatory fields
    if (!issueType || !specificSpot) {
      return res.status(400).json({ 
        message: "Issue type and specific spot are required" 
      });
    }

    if (!tenantBuilding || !tenantUnit) {
      return res.status(400).json({
        message: "Tenant building and unit information is missing in profile"
      });
    }

    // Process uploaded files
    const media = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const fileType = file.mimetype.startsWith("image/") ? "image" : "video";
        media.push({
          url: `/uploads/${file.filename}`,
          type: fileType,
          filename: file.originalname
        });
      });
    }

    // Create issue
    const issue = await Issue.create({
      tenant: req.user._id,
      issueType,
      building: tenantBuilding,
      unitNumber: tenantUnit,
      specificSpot,
      description: description || "",
      media,
      status: "new",
      priority: "medium"
    });

    return res.status(201).json({
      message: "Issue reported successfully",
      issue
    });

  } catch (error) {
    console.error("Create issue error:", error);
    return res.status(500).json({ message: "Failed to create issue", error: error.message });
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
      .populate("assignedTo", "name staffType phone");

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
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const { status, priority, assignedTo, resolutionNotes } = req.body;
    const assignedStaffId = getAssignedStaffId(issue);

    if (req.user.role === "staff") {
      if (assignedStaffId !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to update this issue" });
      }

      if (status) {
        const mappedStatus = statusAliasMap[normalizeStatus(status)];
        if (!mappedStatus) {
          return res.status(400).json({ message: "Invalid status value" });
        }

        const currentStatus = issue.status;
        const validTransition =
          (currentStatus === "new" && mappedStatus === "in progress") ||
          (currentStatus === "in progress" && mappedStatus === "completed");

        if (!validTransition) {
          return res.status(400).json({
            message: "Staff can only move tasks from New to In Progress, or In Progress to Completed."
          });
        }

        issue.status = mappedStatus;
        if (mappedStatus === "completed") {
          issue.resolvedAt = new Date();
        }
      }

      if (resolutionNotes !== undefined) {
        issue.resolutionNotes = resolutionNotes;
      }
    } else if (req.user.role === "admin") {
      if (status) {
        const mappedStatus = statusAliasMap[normalizeStatus(status)];
        if (!mappedStatus) {
          return res.status(400).json({ message: "Invalid status value" });
        }
        issue.status = mappedStatus;
      }
      if (priority) issue.priority = priority;
      if (assignedTo !== undefined) {
        issue.assignedTo = assignedTo || null;
        if (assignedTo && issue.status === "assigned") {
          issue.status = "new";
        }
      }
      if (resolutionNotes !== undefined) issue.resolutionNotes = resolutionNotes;

      if (
        (issue.status === "completed" || issue.status === "done and payment pending") &&
        !issue.resolvedAt
      ) {
        issue.resolvedAt = new Date();
      }
    } else {
      return res.status(403).json({ message: "Not authorized to update this issue" });
    }

    await issue.save();

    const updatedIssue = await Issue.findById(issue._id)
      .populate("tenant", "name email apartmentNumber")
      .populate("assignedTo", "name staffType");

    return res.json({
      message: "Issue updated successfully",
      issue: updatedIssue
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
