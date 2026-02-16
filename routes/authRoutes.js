import express from "express";
import { 
  tenantRegister, 
  staffRegister, 
  loginUser,
  updateProfile,
  changePassword,
  getProfile
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/tenant-register", tenantRegister);
router.post("/staff-register", staffRegister);
router.post("/login", loginUser);

// Protected routes
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.put("/password", authMiddleware, changePassword);

export default router;
