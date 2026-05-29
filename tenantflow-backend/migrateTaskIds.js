import mongoose from "mongoose";
import dotenv from "dotenv";
import Task from "./models/Task.js";

dotenv.config();

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;

  const rawValue = value?._id?.toString?.() || value.toString();
  return new mongoose.Types.ObjectId(rawValue);
};

const runMigration = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB. Starting task id migration...");

    const tasks = await Task.find({})
      .sort({ updatedAt: -1, createdAt: -1 })
      .populate("issue")
      .lean();

    let migratedCount = 0;
    let deletedCount = 0;
    let alignedCount = 0;
    let skippedCount = 0;

    for (const task of tasks) {
      try {
        const canonicalId = task.issue?._id?.toString?.() || task.issue?.toString?.();

        if (!canonicalId) {
          skippedCount += 1;
          console.log(`Skipped task ${task._id}: missing linked issue`);
          continue;
        }

        const taskId = task._id?.toString?.();
        const canonicalObjectId = toObjectId(canonicalId);

        if (taskId === canonicalId) {
          await Task.updateOne(
            { _id: canonicalObjectId },
            { $set: { issue: canonicalObjectId } }
          );
          alignedCount += 1;
          continue;
        }

        const canonicalExists = await Task.exists({ _id: canonicalObjectId });

        if (!canonicalExists) {
          const { _id, issue, __v, createdAt, updatedAt, ...rest } = task;
          const replacement = {
            ...rest,
            _id: canonicalObjectId,
            issue: canonicalObjectId,
            createdAt: createdAt ? new Date(createdAt) : new Date(),
            updatedAt: updatedAt ? new Date(updatedAt) : new Date()
          };

          await Task.collection.replaceOne(
            { _id: canonicalObjectId },
            replacement,
            { upsert: true }
          );

          migratedCount += 1;
        } else {
          alignedCount += 1;
        }

        await Task.deleteOne({ _id: task._id });
        deletedCount += 1;
      } catch (taskError) {
        skippedCount += 1;
        console.error(`Failed to migrate task ${task._id}:`, taskError.message);
      }
    }

    const summary = await Task.aggregate([
      {
        $group: {
          _id: "$issue",
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    console.log("\nTask id migration complete.");
    console.log(`Migrated: ${migratedCount}`);
    console.log(`Deleted legacy duplicates: ${deletedCount}`);
    console.log(`Already aligned: ${alignedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Remaining duplicate issue links: ${summary.length}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Task id migration failed:", error.message);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
};

runMigration();