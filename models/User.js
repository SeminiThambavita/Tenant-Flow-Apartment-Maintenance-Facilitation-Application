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

  // Tenant fields
  apartmentNumber: { 
    type: String, 
    required: function() { return this.role === "tenant"; } 
  },
  floorNumber: { 
    type: String, 
    required: function() { return this.role === "tenant"; } 
  },
  nic: { 
    type: String, 
    required: function() { return this.role === "tenant"; } 
  },
  profileImage: { 
    type: String, 
    required: function() { return this.role === "tenant"; } 
  },

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
    required: function() { return this.role === "staff"; }
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
