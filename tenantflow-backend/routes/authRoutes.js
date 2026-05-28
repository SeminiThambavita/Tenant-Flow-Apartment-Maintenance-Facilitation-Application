import express from "express";
import { 
  tenantRegister, 
  staffRegister, 
  loginUser,
  updateProfile,
  changePassword,
  getProfile,
  getPendingStaff,
  getPendingStaffById,
  getApprovedStaff,
  getTenants,
  updateStaffStatus
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

const staffRegisterUpload = upload.fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "idDocument", maxCount: 1 }
]);

const tenantRegisterUpload = upload.fields([
  { name: "profilePhoto", maxCount: 1 }
]);

const profilePhotoUpload = upload.fields([
  { name: "profilePhoto", maxCount: 1 }
]);

// Public routes
router.post(
  "/tenant-register",
  (req, res, next) => {
    tenantRegisterUpload(req, res, (error) => {
      if (error) {
        return res.status(400).json({ message: error.message || "Invalid file upload." });
      }
      next();
    });
  },
  tenantRegister
);
router.post(
  "/staff-register",
  (req, res, next) => {
    staffRegisterUpload(req, res, (error) => {
      if (error) {
        return res.status(400).json({ message: error.message || "Invalid file upload." });
      }
      next();
    });
  },
  staffRegister
);
router.post("/login", loginUser);

// Protected routes
router.get("/profile", authMiddleware, getProfile);
router.put(
  "/profile",
  authMiddleware,
  (req, res, next) => {
    profilePhotoUpload(req, res, (error) => {
      if (error) {
        return res.status(400).json({ message: error.message || "Invalid file upload." });
      }
      next();
    });
  },
  updateProfile
);
router.put("/password", authMiddleware, changePassword);

// Admin routes for staff approvals
router.get("/staff/pending", authMiddleware, roleMiddleware(["admin"]), getPendingStaff);
router.get("/staff/approved", authMiddleware, roleMiddleware(["admin"]), getApprovedStaff);
router.get("/tenants", authMiddleware, roleMiddleware(["admin"]), getTenants);
router.get("/staff/:id", authMiddleware, roleMiddleware(["admin"]), getPendingStaffById);
router.put("/staff/:id/status", authMiddleware, roleMiddleware(["admin"]), updateStaffStatus);

export default router;
