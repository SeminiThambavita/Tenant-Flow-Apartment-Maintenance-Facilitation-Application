import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
	initiatePayment,
	verifyPayment,
	getPayments,
	handlePaymentNotify,
	deletePayment
} from "../controllers/paymentController.js";

const router = express.Router();

// PayHere notify (no auth)
router.post("/notify", handlePaymentNotify);

// Protected routes
router.post("/initiate", authMiddleware, initiatePayment);
router.get("/", authMiddleware, getPayments);
router.get("/:orderId", authMiddleware, verifyPayment);
router.delete("/:id", authMiddleware, deletePayment);

export default router;
