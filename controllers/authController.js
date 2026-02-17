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

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await user.matchPassword(password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    // prevent pending or rejected staff from login
    if (user.role === "staff" && user.status !== "approved") {
      return res.status(403).json({
        message: "Your account is not approved yet."
      });
    }

    return res.json({
      message: "Login successful",
      role: user.role,
      status: user.status,
      token: generateToken(user._id, user.role)
    });

  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, email, apartmentNumber, floorNumber, nic } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: "Email already exists" });
      }
      user.email = email;
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (user.role === "tenant") {
      if (apartmentNumber) user.apartmentNumber = apartmentNumber;
      if (floorNumber) user.floorNumber = floorNumber;
      if (nic) user.nic = nic;
    }

    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        apartmentNumber: user.apartmentNumber,
        floorNumber: user.floorNumber,
        nic: user.nic
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Profile update failed", error });
  }
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const match = await user.matchPassword(currentPassword);
    if (!match) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    return res.json({
      message: "Password changed successfully"
    });

  } catch (error) {
    res.status(500).json({ message: "Password change failed", error });
  }
};

// GET USER PROFILE
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile", error });
  }
};
