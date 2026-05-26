import dns from "dns";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();
dns.setServers(["8.8.8.8", "1.1.1.1"]);

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const adminSeeds = [
      {
        name: "Property Manager Semini",
        email: "kaushalyatvs.22@uom.lk",
        password: "Admin@123",
        phone: "0111234567",
        role: "admin",
        status: "approved"
      },
      {
        name: "Property Manager Sarah Jenkins",
        email: "sarah.jenkins@tenantflow.com",
        password: "Admin@123",
        phone: "0119876543",
        role: "admin",
        status: "approved"
      }
    ];

    for (const admin of adminSeeds) {
      const exists = await User.findOne({ email: admin.email });
      if (!exists) {
        await User.create(admin);
      }
    }

    console.log("Admin users seeded/verified successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.log(err);
    process.exit(1);
  });
