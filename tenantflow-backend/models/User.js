import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  role: { 
    type: String, 
    enum: ["tenant", "staff", "admin"], 
    default: "tenant" 
  },

  phone: { type: String, required: true },

  // Building reference for tenant
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Building",
    required: function() { return this.role === "tenant"; }
  },
  floor: {
    type: Number,
    required: function() { return this.role === "tenant"; }
  },
  unit: {
    type: String,
    required: function() { return this.role === "tenant"; }
  },

  // Legacy fields (kept for backward compatibility)
  buildingName: {
    type: String
  },
  unitNumber: {
    type: String
  },
  apartmentNumber: { 
    type: String
  },
  floorNumber: { 
    type: String
  },
  nic: { 
    type: String,
    required: function() { return this.role === "tenant"; } 
  },
  profileImage: { 
    type: String,
    required: function() { return this.role === "tenant"; } 
  },

  // Property Manager (Admin) fields
  buildings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building"
    }
  ],

  // Staff fields
  staffType: { 
    type: String, 
    enum: ["plumber", "electrician", "cleaner", "carpenter", "other"],
    required: function() { return this.role === "staff"; }
  },
  shift: { 
    type: String, 
    required: function() { return this.role === "staff"; }
  },
  skills: { 
    type: String,
    default: ""
  },

  nationalId: {
    type: String,
    required: function() { return this.role === "staff"; }
  },
  primaryDepartment: {
    type: String,
    required: function() { return this.role === "staff"; }
  },
  secondarySkills: {
    type: [String],
    default: []
  },
  yearsOfExperience: {
    type: Number,
    default: 0
  },
  certifications: {
    type: String,
    default: ""
  },
  workStatus: {
    type: String,
    enum: ["full-time", "part-time", "on-call"],
    required: function() { return this.role === "staff"; }
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  maxJobsPerDay: {
    type: Number,
    default: 1
  },
  availableWeekdaysFrom: {
    type: String
  },
  availableWeekdaysTo: {
    type: String
  },
  availableWeekendsFrom: {
    type: String
  },
  availableWeekendsTo: {
    type: String
  },
  bankName: {
    type: String
  },
  accountNumber: {
    type: String
  },
  accountHolderName: {
    type: String
  },
  branchCode: {
    type: String
  },
  branchName: {
    type: String
  },
  agreeBackgroundCheck: {
    type: Boolean,
    default: false
  },
  agreeTerms: {
    type: Boolean,
    default: false
  },
  agreeTax: {
    type: Boolean,
    default: false
  },
  agreeProfessional: {
    type: Boolean,
    default: false
  },
  staffProfilePhoto: {
    type: String
  },
  staffIdDocument: {
    type: String
  },

  // Staff approval system
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: function () {
      return this.role === "staff" ? "pending" : "approved"; 
    }
  }
}, { timestamps: true });

// Hash password automatically
userSchema.pre("save", async function() {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPw) {
  return bcrypt.compare(enteredPw, this.password);
};

export default mongoose.model("User", userSchema);
