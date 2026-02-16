import Issue from "../models/Issue.js";

// @desc    Create new issue
// @route   POST /issues
// @access  Private (Tenant)
export const createIssue = async (req, res) => {
  try {
    const { issueType, building, unitNumber, specificSpot, description } = req.body;

    // Validate mandatory fields
    if (!issueType || !building || !unitNumber || !specificSpot) {
      return res.status(400).json({ 
        message: "Issue type, building, unit number, and specific spot are required" 
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
      building,
      unitNumber,
      specificSpot,
      description: description || "",
      media,
      status: "pending",
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

    let query = { tenant: req.user._id };
    
    // Filter by status if provided
    if (status && status !== "all") {
      query.status = status;
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

    // Check authorization: tenants can only view their own issues
    if (req.user.role === "tenant" && issue.tenant._id.toString() !== req.user._id.toString()) {
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

    // Update fields
    if (status) issue.status = status;
    if (priority) issue.priority = priority;
    if (assignedTo) issue.assignedTo = assignedTo;
    if (resolutionNotes) issue.resolutionNotes = resolutionNotes;

    // Set resolvedAt when status changes to completed
    if (status === "completed" && !issue.resolvedAt) {
      issue.resolvedAt = new Date();
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
