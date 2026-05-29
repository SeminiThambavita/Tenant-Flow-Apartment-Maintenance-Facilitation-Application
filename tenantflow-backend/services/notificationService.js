import Notification from "../models/Notification.js";
import Invoice from "../models/Invoice.js";
import Issue from "../models/Issue.js";
import User from "../models/User.js";

/**
 * Create a notification for a user
 */
export const createNotification = async (recipientId, notificationData) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      ...notificationData
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Notify a tenant that an invoice has been sent
 */
export const notifyInvoiceSent = async (invoiceId, senderId) => {
  try {
    const invoice = await Invoice.findById(invoiceId)
      .populate("tenant", "name email")
      .populate({
        path: "issue",
        select: "issueType building unitNumber unit",
        populate: [{ path: "building", select: "name" }]
      })
      .exec();

    if (!invoice || !invoice.tenant) {
      console.error("Invoice or tenant not found for invoice notification:", invoiceId);
      return;
    }

    await createNotification(invoice.tenant._id, {
      type: "invoice_sent",
      issue: invoice.issue?._id || invoice.issue,
      title: "Invoice Sent to You",
      message: `Your invoice ${invoice.invoiceNumber} is now available in My Invoices. Total due: LKR ${Number(invoice.total || 0).toFixed(2)}.`,
      actionUrl: `/tenant-dashboard?menu=invoices&invoiceId=${invoice._id}`,
      data: {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        issueType: invoice.issue?.issueType,
        unitNumber: invoice.location?.unitNumber || invoice.issue?.unitNumber || invoice.issue?.unit,
        building: invoice.location?.building || invoice.issue?.building?.name,
        total: invoice.total,
        newStatus: invoice.status,
        changedBy: senderId?.toString?.() || senderId
      }
    });
  } catch (error) {
    console.error("Error notifying invoice sent:", error);
  }
};

/**
 * Notify manager and assigned staff when a tenant payment is received
 */
export const notifyPaymentReceived = async (invoiceId, payment) => {
  try {
    const invoice = await Invoice.findById(invoiceId)
      .populate("tenant", "name email")
      .populate({
        path: "issue",
        select: "issueType building floor unit unitNumber specificSpot assignedTo propertyManager",
        populate: [
          { path: "assignedTo", select: "name email staffType" },
          { path: "propertyManager", select: "name email" },
          { path: "building", select: "name" }
        ]
      })
      .exec();

    if (!invoice || !invoice.issue) {
      return;
    }

    const issue = invoice.issue;
    const buildingName = issue.building?.name || invoice.location?.building?.name || "Building";
    const unitNumber = invoice.location?.unitNumber || issue.unitNumber || issue.unit || "—";
    const taskId = issue._id?.toString?.() || issue._id || invoice.taskId || invoice.issue?.toString?.();
    const taskName = invoice.taskName || `${issue.issueType || "Maintenance"}${issue.specificSpot ? ` - ${issue.specificSpot}` : ""}`;
    const payload = {
      type: "payment_received",
      issue: issue._id,
      title: "Payment Received",
      message: `Payment received for invoice ${invoice.invoiceNumber} linked to ${taskName}.`,
      actionUrl: `/admin/in-progress-repairs/${issue._id}`,
      data: {
        invoiceId: invoice._id?.toString?.() || invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        taskId,
        taskName,
        paymentId: payment?._id?.toString?.() || payment?._id,
        paymentOrderId: payment?.orderId,
        paymentReference: payment?.payherePaymentId || payment?.orderId,
        amount: payment?.amount ?? invoice.total,
        paymentMethod: payment?.paymentMethod || 'payhere',
        tenantName: invoice.tenant?.name,
        issueType: issue.issueType,
        unitNumber,
        building: buildingName,
        newStatus: 'payment done'
      }
    };

    if (issue.assignedTo?._id) {
      await createNotification(issue.assignedTo._id, payload);
    }

    const managerId = issue.propertyManager?._id || issue.propertyManager || invoice.propertyManager?._id || invoice.propertyManager;
    if (managerId) {
      await createNotification(managerId, payload);
    }
  } catch (error) {
    console.error("Error notifying payment received:", error);
  }
};

/**
 * Notify all relevant parties when an issue is reported
 */
export const notifyIssueReported = async (issue, propertyManagerId) => {
  try {
    // Populate issue details with tenant and building info
    const populatedIssue = await Issue.findById(issue._id)
      .populate("tenant", "name email")
      .populate("building", "name")
      .exec();

    if (!populatedIssue) {
      console.error("Issue not found for notification:", issue._id);
      return;
    }

    if (!populatedIssue.tenant) {
      console.error("Tenant not found for issue:", issue._id);
      return;
    }

    const buildingName = populatedIssue.building?.name || "Building";
    const tenantName = populatedIssue.tenant?.name || "Tenant";

    const notificationData = {
      type: "issue_reported",
      issue: issue._id,
      data: {
        issueType: populatedIssue.issueType,
        unit: populatedIssue.unit,
        building: buildingName,
        tenantName: tenantName
      }
    };

    // Notify property manager
    if (propertyManagerId) {
      await createNotification(propertyManagerId, {
        ...notificationData,
        title: "New Issue Reported",
        message: `${tenantName} reported a ${populatedIssue.issueType} issue in ${buildingName}, Unit ${populatedIssue.unit}`,
        actionUrl: `/admin/task-assignment`
      });
    }

    // Notify tenant
    await createNotification(populatedIssue.tenant._id, {
      type: "issue_reported",
      issue: issue._id,
      title: "Issue Reported Successfully",
      message: "Your issue has been reported and assigned to a property manager.",
      data: notificationData.data
    });

  } catch (error) {
    console.error("Error notifying issue reported:", error);
  }
};

/**
 * Notify all parties when a task is assigned
 */
export const notifyTaskAssigned = async (issue, staffId, managerId) => {
  try {
    const populatedIssue = await Issue.findById(issue._id)
      .populate("tenant", "name email")
      .populate("assignedTo", "name staffType")
      .populate("building", "name")
      .exec();

    if (!populatedIssue || !populatedIssue.tenant) {
      console.error("Issue or tenant not found for task assignment notification");
      return;
    }

    const staffMember = await User.findById(staffId).select("name staffType email");
    if (!staffMember) {
      console.error("Staff member not found:", staffId);
      return;
    }

    const tenant = populatedIssue.tenant;
    const buildingName = populatedIssue.building?.name || "Building";

    const notificationData = {
      type: "task_assigned",
      issue: issue._id,
      data: {
        assignedStaffName: staffMember.name,
        issueType: populatedIssue.issueType,
        unit: populatedIssue.unit,
        building: buildingName,
        tenantName: tenant.name
      }
    };

    // Notify staff member
    await createNotification(staffId, {
      ...notificationData,
      title: "Task Assigned to You",
      message: `A new ${populatedIssue.issueType} task has been assigned to you at ${buildingName}, Unit ${populatedIssue.unit}`,
      actionUrl: `/staff/tasks`
    });

    // Notify tenant
    await createNotification(tenant._id, {
      type: "task_assigned",
      issue: issue._id,
      title: "Staff Member Assigned",
      message: `${staffMember.name} has been assigned to work on your ${populatedIssue.issueType} issue`,
      data: notificationData.data
    });

    // Notify property manager
    if (managerId) {
      await createNotification(managerId, {
        ...notificationData,
        title: "Task Assigned",
        message: `You assigned the ${populatedIssue.issueType} task to ${staffMember.name}`
      });
    }

  } catch (error) {
    console.error("Error notifying task assigned:", error);
  }
};

/**
 * Notify all parties when task status changes
 */
export const notifyStatusChanged = async (issue, previousStatus, newStatus, managerId) => {
  try {
    const populatedIssue = await Issue.findById(issue._id)
      .populate("tenant", "name email")
      .populate("assignedTo", "name staffType email")
      .populate("building", "name")
      .exec();

    const tenant = populatedIssue.tenant;
    const staffMember = populatedIssue.assignedTo;
    const buildingName = populatedIssue.building?.name || "Building";

    const statusMessages = {
      "assigned": {
        title: "Task Assigned",
        getTenantMsg: (staff) => `Your issue has been assigned to ${staff.name}`,
        getStaffMsg: () => "Your new task is ready to start",
        getManagerMsg: (staff) => `Task assigned to ${staff.name}`
      },
      "in progress": {
        title: "Work Started",
        getTenantMsg: (staff) => `${staff.name} has started working on your issue`,
        getStaffMsg: () => "You have started working on this task",
        getManagerMsg: (staff) => `${staff.name} started working on the task`
      },
      "completed": {
        title: "Task Completed",
        getTenantMsg: (staff) => `${staff.name} has completed your issue resolution`,
        getStaffMsg: () => "You have marked this task as completed",
        getManagerMsg: (staff) => `Task completed by ${staff.name}`
      }
    };

    const msgConfig = statusMessages[newStatus];
    const notificationData = {
      type: "task_status_changed",
      issue: issue._id,
      data: {
        previousStatus,
        newStatus,
        issueType: populatedIssue.issueType,
        unit: populatedIssue.unit,
        building: buildingName,
        tenantName: tenant.name,
        assignedStaffName: staffMember?.name
      }
    };

    if (msgConfig && staffMember) {
      // Notify tenant
      await createNotification(tenant._id, {
        ...notificationData,
        title: msgConfig.title,
        message: msgConfig.getTenantMsg(staffMember)
      });

      // Notify staff
      await createNotification(staffMember._id, {
        ...notificationData,
        title: msgConfig.title,
        message: msgConfig.getStaffMsg(),
        actionUrl: `/staff/tasks/${issue._id}`
      });

      // Notify property manager
      if (managerId) {
        await createNotification(managerId, {
          ...notificationData,
          title: msgConfig.title,
          message: msgConfig.getManagerMsg(staffMember)
        });
      }
    }

  } catch (error) {
    console.error("Error notifying status changed:", error);
  }
};

/**
 * Notify staff to create cost report
 */
export const notifyCostReportRequired = async (issue, staffId) => {
  try {
    await createNotification(staffId, {
      type: "task_status_changed",
      issue: issue._id,
      title: "Cost Report Required",
      message: "Please create a cost report for the completed task before submitting for payment",
      actionUrl: `/staff/tasks/${issue._id}/cost-report`,
      data: {
        issueType: issue.issueType,
        unit: issue.unit
      }
    });
  } catch (error) {
    console.error("Error notifying cost report required:", error);
  }
};

/**
 * Get unread notification count for a user
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });
    return count;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};
