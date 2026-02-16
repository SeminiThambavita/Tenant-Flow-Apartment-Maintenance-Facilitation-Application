import mongoose from "mongoose";

const issueSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  // Section 1: Issue Type
  issueType: {
    type: String,
    enum: ["plumbing", "electrical", "cleaning", "carpentry", "other"],
    required: true
  },
  
  // Section 2: Location (Mandatory)
  building: {
    type: String,
    required: true
  },
  unitNumber: {
    type: String,
    required: true
  },
  specificSpot: {
    type: String,
    required: true
  },
  
  // Section 3: Description
  description: {
    type: String,
    maxlength: 500,
    default: ""
  },
  
  // Section 4: Media files
  media: [{
    url: { type: String, required: true },
    type: { type: String, enum: ["image", "video"], required: true },
    filename: { type: String }
  }],
  
  // Status tracking
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed"],
    default: "pending"
  },
  
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  
  // Assigned staff member
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  
  // Resolution details
  resolvedAt: {
    type: Date
  },
  resolutionNotes: {
    type: String
  }
  
}, { timestamps: true });

export default mongoose.model("Issue", issueSchema);
