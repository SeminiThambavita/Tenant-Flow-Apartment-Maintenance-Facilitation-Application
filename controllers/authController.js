import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";

// TENANT REGISTER
export const tenantRegister = async (req, res) => {
  try {
    const {
      name, email, password, phone,
      apartmentNumber, floorNumber, nic, profileImage
    } = req.body;

    // check mandatory fields
    if (!name || !email || !password || !phone ||
        !apartmentNumber || !floorNumber || !nic || !profileImage) {
      return res.status(400).json({ message: "All tenant fields are required." });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const user = await User.create({
      name,
      email,
      password,
      phone,
      apartmentNumber,
      floorNumber,
      nic,
      profileImage,
      role: "tenant",
      status: "approved"  // tenants can login immediately
    });

    return res.status(201).json({
      message: "Tenant registered successfully",
      token: generateToken(user._id, user.role)
    });

  } catch (error) {
    res.status(500).json({ message: "Tenant registration failed", error });
  }
};

// STAFF REGISTER
export const staffRegister = async (req, res) => {
  try {
    const {
      name, email, password, phone,
      staffType, shift, skills
    } = req.body;

    if (!name || !email || !password || !phone || !staffType || !shift || !skills) {
      return res.status(400).json({ message: "All staff fields are required." });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const user = await User.create({
      name,
      email,
      password,
      phone,
      staffType,
      shift,
      skills,
      role: "staff",
      status: "pending"
    });

    return res.status(201).json({
      message: "Staff registered. Waiting for admin approval."
    });

  } catch (error) {
    res.status(500).json({ message: "Staff registration failed", error });
  }
};
