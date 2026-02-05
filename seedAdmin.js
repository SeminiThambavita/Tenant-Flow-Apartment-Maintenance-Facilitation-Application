import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const exists = await User.findOne({ role: "admin" });

    if (exists) {
      console.log("Admin already exists");
      process.exit(0);
    }

    await User.create({
      name: "Property Manager Semini",
      email: "kaushalyatvs.22@uom.lk",
      password: "Admin@123",
      phone: "0111234567",
      role: "admin",
      status: "approved"
    });

    console.log("Admin user seeded!");
    process.exit(0);
  })
  .catch(err => {
    console.log(err);
    process.exit(1);
  });
