import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "./config/db.js";
import User from "./models/User.js";

const fixPasswords = async () => {
  try {
    await connectDB();
    console.log("✓ Connected to database");

    // Fix property managers
    const propertyManagerEmails = [
      "rajesh.kumar@propertymanagement.com",
      "priya.sharma@propertymanagement.com",
      "anil.perera@propertymanagement.com"
    ];

    for (const email of propertyManagerEmails) {
      // Bypass pre-save hook by directly updating
      await User.updateOne(
        { email },
        {
          $set: { password: await bcrypt.hash("password123", 10) }
        }
      );
      console.log(`✓ Fixed password for: ${email}`);
    }

    // Also fix the other admin user if it exists
    await User.updateOne(
      { email: "kaushalyatvs.22@uom.lk" },
      {
        $set: { password: await bcrypt.hash("Admin@123", 10) }
      }
    );
    console.log("✓ Fixed password for: kaushalyatvs.22@uom.lk");

    console.log("\n✓ All passwords have been fixed!");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing passwords:", error);
    process.exit(1);
  }
};

fixPasswords();
