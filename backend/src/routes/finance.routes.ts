import { Router } from "express";
import { authenticate, requireRole } from "@/middlewares/auth.middleware";
import { validateBody } from "@/middlewares/validate.middleware";
import {
  createInvoice,
  financeSummary,
  recordPayment,
} from "@/controllers/finance.controller";
import { invoiceSchema, paymentSchema } from "@/controllers/finance.controller";

const router = Router();

router.use(authenticate);

router.post("/invoices", requireRole(["Super Admin", "Finance Officer", "School Admin"]), validateBody(invoiceSchema), createInvoice);
router.post("/payments", requireRole(["Super Admin", "Finance Officer", "School Admin"]), validateBody(paymentSchema), recordPayment);
router.get("/summary", requireRole(["Super Admin", "Finance Officer", "School Admin"]), financeSummary);

export default router;
