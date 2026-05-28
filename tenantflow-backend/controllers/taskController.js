import Task from "../models/Task.js";
import Issue from "../models/Issue.js";

// CREATE TASK
export const createTask = async (req, res) => {
  try {
    const { issueId, assignedTo, estimatedHours, priority, dueDate } = req.body;

    if (!issueId || !assignedTo) {
      return res.status(400).json({ message: "Issue ID and assigned staff member are required" });
    }

    const issue = await Issue.findById(issueId).populate("building");
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const task = await Task.create({
      issue: issueId,
      assignedTo,
      description: issue.description,
      building: issue.building,
      priority: priority || "medium",
      estimatedHours: estimatedHours || 0,
      dueDate,
      assignedBy: req.user._id,
      status: "pending"
    });

    // Update issue status to 'assigned'
    await Issue.findByIdAndUpdate(issueId, { status: "assigned", assignedTo });

    return res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create task", error: error.message });
  }
};

// GET ALL TASKS (for staff or admin)
export const getTasks = async (req, res) => {
  try {
    let filter = {};

    // Tenants don't get tasks, only staff and admins
    if (req.user.role === "staff") {
      filter.assignedTo = req.user._id;
    } else if (req.user.role === "admin") {
      // Admins see all tasks
      filter = {};
    } else {
      return res.status(403).json({ message: "Not authorized to view tasks" });
    }

    const status = req.query.status;
    if (status) {
      filter.status = status;
    }

    const tasks = await Task.find(filter)
      .populate("issue", "issueType building floor unit description")
      .populate("assignedTo", "name email phone")
      .populate("building", "name")
      .sort({ createdAt: -1 });

    return res.json({ count: tasks.length, tasks });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
  }
};

// GET SINGLE TASK
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("issue")
      .populate("assignedTo", "name email phone")
      .populate("building", "name")
      .populate("costReport");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check authorization
    if (req.user.role === "staff" && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this task" });
    }

    return res.json({ task });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch task", error: error.message });
  }
};

// UPDATE TASK
export const updateTask = async (req, res) => {
  try {
    const { status, actualHours, notes, completionNotes, dueDate, priority } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check authorization - only assigned staff or admin can update
    if (req.user.role === "staff" && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this task" });
    }

    if (status) {
      task.status = status;
      if (status === "in-progress" && !task.startDate) {
        task.startDate = new Date();
      }
      if (status === "completed") {
        task.completionDate = new Date();
      }
    }

    if (actualHours !== undefined) task.actualHours = actualHours;
    if (notes !== undefined) task.notes = notes;
    if (completionNotes !== undefined) task.completionNotes = completionNotes;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (priority !== undefined) task.priority = priority;

    await task.save();

    // Update issue status if task is completed
    if (status === "completed") {
      await Issue.findByIdAndUpdate(task.issue, { status: "task done" });
    }

    return res.json({ message: "Task updated successfully", task });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update task", error: error.message });
  }
};

// DELETE TASK
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Only admin can delete tasks
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only administrators can delete tasks" });
    }

    await Task.findByIdAndDelete(req.params.id);

    return res.json({ message: "Task deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete task", error: error.message });
  }
};
