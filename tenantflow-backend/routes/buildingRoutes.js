import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getBuildings,
  getBuildingById,
  getAvailableUnits,
  checkUnitAvailability,
  occupyUnit,
  releaseUnit,
  createBuilding,
  assignPropertyManager,
  getMyBuildings,
  seedBuildings
} from "../controllers/buildingController.js";

const router = express.Router();

// Public routes (no auth required)
router.get("/", getBuildings);
router.get("/:id", getBuildingById);
router.post("/check-availability", checkUnitAvailability);
router.get("/:buildingId/available-units", getAvailableUnits);

// Protected routes (auth required)
router.post("/occupy-unit", authMiddleware, occupyUnit);
router.post("/release-unit", authMiddleware, occupyUnit);

// Admin only routes
router.post("/", authMiddleware, roleMiddleware(["admin"]), createBuilding);
router.post("/assign-manager", authMiddleware, roleMiddleware(["admin"]), assignPropertyManager);
router.get("/my-buildings", authMiddleware, roleMiddleware(["admin"]), getMyBuildings);
router.post("/seed", authMiddleware, roleMiddleware(["admin"]), seedBuildings);

export default router;
