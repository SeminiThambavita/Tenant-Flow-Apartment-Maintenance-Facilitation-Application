import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";

// TENANT REGISTER
export const tenantRegister = async (req, res) => {
  try {
    const {
      name, email, password, phone,
      buildingName, unitNumber, apartmentNumber, floorNumber, nic, profileImage
    } = req.body;

    const normalizedApartmentNumber = apartmentNumber || unitNumber;

    // check mandatory fields
    if (!name || !email || !password || !phone ||
        !buildingName || !unitNumber || !floorNumber || !nic || !profileImage) {
      return res.status(400).json({ message: "All tenant fields are required." });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const user = await User.create({
      name,
      email,
      password,
      phone,
      buildingName,
      unitNumber,
      apartmentNumber: normalizedApartmentNumber,
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
    const toBoolean = (value) => value === true || value === "true";
    const toNumber = (value) => {
      const num = Number(value);
      return Number.isNaN(num) ? undefined : num;
    };

    let parsedSecondarySkills = [];
    if (Array.isArray(req.body.secondarySkills)) {
      parsedSecondarySkills = req.body.secondarySkills;
    } else if (typeof req.body.secondarySkills === "string" && req.body.secondarySkills.trim() !== "") {
      try {
        const parsed = JSON.parse(req.body.secondarySkills);
        if (Array.isArray(parsed)) {
          parsedSecondarySkills = parsed;
        }
      } catch {
        parsedSecondarySkills = req.body.secondarySkills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    const profilePhotoFile = req.files?.profilePhoto?.[0];
    const idDocumentFile = req.files?.idDocument?.[0];

    const {
      name,
      email,
      password,
      phone,
      nationalId,
      primaryDepartment,
      secondarySkills,
      yearsOfExperience,
      certifications,
      workStatus,
      maxJobsPerDay,
      availableWeekdaysFrom,
      availableWeekdaysTo,
      availableWeekendsFrom,
      availableWeekendsTo,
      bankName,
      accountNumber,
      accountHolderName,
      branchCode,
      branchName,
      agreeBackgroundCheck,
      agreeTerms,
      agreeTax,
      agreeProfessional
    } = req.body;

    const yearsOfExperienceNumber = toNumber(yearsOfExperience);
    const maxJobsPerDayNumber = toNumber(maxJobsPerDay);

    const agreeBackgroundCheckBool = toBoolean(agreeBackgroundCheck);
    const agreeTermsBool = toBoolean(agreeTerms);
    const agreeTaxBool = toBoolean(agreeTax);
    const agreeProfessionalBool = toBoolean(agreeProfessional);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(?:\+94|0)?7[0-9]{8}$/;
    const nicRegex = /^(?:\d{9}[vVxX]|\d{12})$/;

    if (
      !name ||
      !email ||
      !password ||
      !phone ||
      !nationalId ||
      !primaryDepartment ||
      yearsOfExperienceNumber === undefined ||
      !workStatus ||
      !maxJobsPerDayNumber ||
      !availableWeekdaysFrom ||
      !availableWeekdaysTo ||
      !bankName ||
      !accountNumber ||
      !accountHolderName ||
      !branchCode ||
      !branchName ||
      !profilePhotoFile
    ) {
      return res.status(400).json({ message: "All required staff fields are required." });
    }

    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (!phoneRegex.test(String(phone).replace(/\s/g, ""))) {
      return res.status(400).json({ message: "Enter a valid Sri Lankan mobile number." });
    }

    if (!nicRegex.test(String(nationalId).trim())) {
      return res.status(400).json({ message: "Enter a valid NIC (9 digits + V/X or 12 digits)." });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const weekendFrom = String(availableWeekendsFrom || "").trim();
    const weekendTo = String(availableWeekendsTo || "").trim();
    if ((weekendFrom && !weekendTo) || (!weekendFrom && weekendTo)) {
      return res.status(400).json({
        message: "Provide both weekend start and end times, or leave both empty."
      });
    }

    if (availableWeekdaysFrom >= availableWeekdaysTo) {
      return res.status(400).json({ message: "Weekday end time must be after start time." });
    }

    if (weekendFrom && weekendTo && weekendFrom >= weekendTo) {
      return res.status(400).json({ message: "Weekend end time must be after start time." });
    }

    if (!agreeBackgroundCheckBool || !agreeTermsBool || !agreeTaxBool || !agreeProfessionalBool) {
      return res.status(400).json({
        message: "All staff agreements must be accepted."
      });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const staffTypeMap = {
      plumbing: "plumber",
      electrical: "electrician",
      carpentry: "carpenter",
      hvac: "other",
      painting: "other",
      general: "other"
    };

    const mappedStaffType = staffTypeMap[primaryDepartment] || "other";

    const shiftMap = {
      "full-time": "Full-time",
      "part-time": "Part-time",
      "on-call": "On-call"
    };

    const mappedShift = shiftMap[workStatus] || workStatus;

    const user = await User.create({
      name,
      email,
      password,
      phone,
      staffType: mappedStaffType,
      shift: mappedShift,
      skills: parsedSecondarySkills.join(", "),
      nationalId,
      primaryDepartment,
      secondarySkills: parsedSecondarySkills,
      yearsOfExperience: yearsOfExperienceNumber,
      certifications: certifications || "",
      workStatus,
      maxJobsPerDay: maxJobsPerDayNumber,
      availableWeekdaysFrom,
      availableWeekdaysTo,
      availableWeekendsFrom: weekendFrom,
      availableWeekendsTo: weekendTo,
      bankName,
      accountNumber,
      accountHolderName,
      branchCode,
      branchName,
      agreeBackgroundCheck: agreeBackgroundCheckBool,
      agreeTerms: agreeTermsBool,
      agreeTax: agreeTaxBool,
      agreeProfessional: agreeProfessionalBool,
      staffProfilePhoto: `/uploads/${profilePhotoFile.filename}`,
      staffIdDocument: idDocumentFile ? `/uploads/${idDocumentFile.filename}` : "",
      role: "staff",
      status: "pending"
    });

    return res.status(201).json({
      message: "Staff registered. Waiting for admin approval."
    });

  } catch (error) {
    const errorMessage = error?.name === "ValidationError"
      ? Object.values(error.errors).map((item) => item.message).join(", ")
      : error?.message || "Staff registration failed";

    res.status(500).json({ message: errorMessage });
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await user.matchPassword(password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    if (role && user.role !== role) {
      return res.status(403).json({
        message: `This account is not registered as ${role}.`
      });
    }

    // prevent pending or rejected staff from login
    if (user.role === "staff" && user.status !== "approved") {
      return res.status(403).json({
        message: "Your account is not approved yet."
      });
    }

    return res.json({
      message: "Login successful",
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      token: generateToken(user._id, user.role)
    });

  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
};

const formatProfileUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  buildingName: user.buildingName,
  unitNumber: user.unitNumber,
  apartmentNumber: user.apartmentNumber,
  floorNumber: user.floorNumber,
  nic: user.nic,
  primaryDepartment: user.primaryDepartment,
  staffType: user.staffType,
  workStatus: user.workStatus,
  yearsOfExperience: user.yearsOfExperience,
  availableWeekdaysFrom: user.availableWeekdaysFrom,
  availableWeekdaysTo: user.availableWeekdaysTo,
  availableWeekendsFrom: user.availableWeekendsFrom,
  availableWeekendsTo: user.availableWeekendsTo,
  isOnline: user.isOnline
});

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      buildingName,
      unitNumber,
      apartmentNumber,
      floorNumber,
      nic,
      workStatus,
      yearsOfExperience,
      primaryDepartment,
      availableWeekdaysFrom,
      availableWeekdaysTo,
      availableWeekendsFrom,
      availableWeekendsTo,
      isOnline
    } = req.body;

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

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    if (user.role === "tenant") {
      if (buildingName !== undefined) user.buildingName = buildingName;
      if (unitNumber !== undefined) user.unitNumber = unitNumber;
      if (apartmentNumber !== undefined) user.apartmentNumber = apartmentNumber;
      if (floorNumber !== undefined) user.floorNumber = floorNumber;
      if (nic !== undefined) user.nic = nic;
    }

    if (user.role === "staff") {
      if (workStatus !== undefined) user.workStatus = workStatus;
      if (yearsOfExperience !== undefined) user.yearsOfExperience = Number(yearsOfExperience);
      if (primaryDepartment !== undefined) user.primaryDepartment = primaryDepartment;
      if (availableWeekdaysFrom !== undefined) user.availableWeekdaysFrom = availableWeekdaysFrom;
      if (availableWeekdaysTo !== undefined) user.availableWeekdaysTo = availableWeekdaysTo;
      if (availableWeekendsFrom !== undefined) user.availableWeekendsFrom = availableWeekendsFrom;
      if (availableWeekendsTo !== undefined) user.availableWeekendsTo = availableWeekendsTo;
      if (isOnline !== undefined) user.isOnline = isOnline === true || isOnline === "true";
    }

    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user: formatProfileUser(user)
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

// @desc    Get pending staff registrations
// @route   GET /auth/staff/pending
// @access  Private (Admin)
export const getPendingStaff = async (req, res) => {
  try {
    const pendingStaff = await User.find({ role: "staff", status: "pending" })
      .select("name email phone staffType shift skills createdAt")
      .sort({ createdAt: -1 });

    return res.json({
      count: pendingStaff.length,
      staff: pendingStaff
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch pending staff", error: error.message });
  }
};

// @desc    Get full details of a specific pending staff registration
// @route   GET /auth/staff/:id
// @access  Private (Admin)
export const getPendingStaffById = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await User.findOne({ _id: id, role: "staff", status: "pending" }).select("-password");
    if (!staff) {
      return res.status(404).json({ message: "Pending staff user not found" });
    }

    return res.json({ staff });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch staff details", error: error.message });
  }
};

// @desc    Get approved staff members
// @route   GET /auth/staff/approved
// @access  Private (Admin)
export const getApprovedStaff = async (req, res) => {
  try {
    const approvedStaff = await User.find({ role: "staff", status: "approved" })
      .select("name email phone staffType primaryDepartment workStatus maxJobsPerDay")
      .sort({ createdAt: -1 });

    return res.json({
      count: approvedStaff.length,
      staff: approvedStaff
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch approved staff", error: error.message });
  }
};

// @desc    Get all tenant profiles
// @route   GET /auth/tenants
// @access  Private (Admin)
export const getTenants = async (req, res) => {
  try {
    const tenants = await User.find({ role: "tenant" })
      .select("name email phone buildingName unitNumber apartmentNumber floorNumber nic createdAt")
      .sort({ buildingName: 1, unitNumber: 1, apartmentNumber: 1, name: 1 });

    return res.json({
      count: tenants.length,
      tenants
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch tenants", error: error.message });
  }
};

// @desc    Update staff approval status
// @route   PUT /auth/staff/:id/status
// @access  Private (Admin)
export const updateStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use approved or rejected." });
    }

    const staff = await User.findOne({ _id: id, role: "staff" });
    if (!staff) {
      return res.status(404).json({ message: "Staff user not found" });
    }

    staff.status = status;
    await staff.save();

    return res.json({
      message: `Staff ${status} successfully`,
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        status: staff.status
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update staff status", error: error.message });
  }
};
