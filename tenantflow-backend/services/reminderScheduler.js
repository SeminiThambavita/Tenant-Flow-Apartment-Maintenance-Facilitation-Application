import Issue from "../models/Issue.js";
import { notifyStartDateOverdue } from "./notificationService.js";

/**
 * Check for overdue scheduled start dates and fire reminders.
 * Runs every hour. Sends one reminder per issue (startDateReminderSent flag).
 */
const checkStartDateReminders = async () => {
  try {
    const now = new Date();

    // Find assigned issues whose scheduled start date has passed,
    // work hasn't started, and a reminder hasn't been sent yet.
    const overdueIssues = await Issue.find({
      status: "assigned",                     // still hasn't been started
      scheduledStartDate: { $lte: now },      // date has passed
      startDateReminderSent: false,           // haven't reminded yet
      assignedTo: { $exists: true, $ne: null }
    });

    for (const issue of overdueIssues) {
      await notifyStartDateOverdue(issue);

      // Mark reminder as sent so we don't spam
      await Issue.findByIdAndUpdate(issue._id, { startDateReminderSent: true });
    }

    if (overdueIssues.length > 0) {
      console.log(`[ReminderScheduler] Sent ${overdueIssues.length} start-date overdue reminder(s).`);
    }
  } catch (error) {
    console.error("[ReminderScheduler] Error checking start date reminders:", error);
  }
};

/**
 * Start the reminder scheduler.
 * Runs once immediately, then every hour.
 */
export const startReminderScheduler = () => {
  const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  // Run once at startup (after a short delay to let DB connect)
  setTimeout(checkStartDateReminders, 10_000);

  // Then run every hour
  setInterval(checkStartDateReminders, INTERVAL_MS);

  console.log("[ReminderScheduler] Start-date reminder scheduler running (checks every hour).");
};
