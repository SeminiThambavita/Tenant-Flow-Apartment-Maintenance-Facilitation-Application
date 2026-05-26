import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
	createInvoice,
	getInvoices,
	getInvoiceById,
	updateInvoice,
	deleteInvoice
} from "../controllers/invoiceController.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createInvoice);
router.get("/", getInvoices);
router.get("/:id", getInvoiceById);
router.put("/:id", updateInvoice);
router.delete("/:id", deleteInvoice);

export default router;
