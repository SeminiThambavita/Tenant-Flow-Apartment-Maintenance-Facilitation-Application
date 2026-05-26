import mongoose from "mongoose";
import dotenv from "dotenv";
import Issue from "./models/Issue.js";

dotenv.config();

const statusMappings = [
  { from: "pending", to: "new" },
  { from: "in-progress", to: "in progress" },
  { from: "completed", to: "done and payment pending" }
];

const runMigration = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB. Starting issue status migration...");

    let totalUpdated = 0;

    for (const mapping of statusMappings) {
      const result = await Issue.updateMany(
        { status: mapping.from },
        { $set: { status: mapping.to } }
      );

      const updatedCount = result.modifiedCount || 0;
      totalUpdated += updatedCount;

      console.log(`Mapped '${mapping.from}' -> '${mapping.to}': ${updatedCount} issue(s) updated`);
    }

    const statusSummary = await Issue.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log("\nMigration complete.");
    console.log(`Total updated: ${totalUpdated} issue(s)`);
    console.log("Current issue statuses:");
    statusSummary.forEach((row) => {
      console.log(`- ${row._id}: ${row.count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Issue status migration failed:", error.message);
    process.exit(1);
  }
};

runMigration();
