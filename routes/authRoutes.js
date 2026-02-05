import express from "express";
import { tenantRegister, staffRegister, loginUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/tenant-register", tenantRegister);
router.post("/staff-register", staffRegister);
router.post("/login", loginUser);

export default router;
