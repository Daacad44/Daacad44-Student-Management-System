import { Request, Response } from "express";
import prisma from "@/lib/prisma";
import { getOrCreateActiveYearTerm } from "@/utils/term";
import { InvoiceStatus, PaymentMethod } from "@prisma/client";
import { z } from "zod";

export const invoiceSchema = z.object({
  studentId: z.number().int().positive(),
  total: z.number().positive(),
  dueDate: z.string().optional(), // ISO date
  status: z.nativeEnum(InvoiceStatus).optional(),
});

export const paymentSchema = z.object({
  invoiceId: z.number().int().positive(),
  amount: z.number().positive(),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().optional(),
});

const nextInvoiceNo = async () => {
  const yy = new Date().getFullYear().toString().slice(-2);
  const last = await prisma.invoice.findFirst({
    where: { invoiceNo: { startsWith: `INV-${yy}-` } },
    orderBy: { invoiceNo: "desc" },
    select: { invoiceNo: true },
  });
  let seq = 1;
  if (last?.invoiceNo) {
    const tail = last.invoiceNo.split("-").pop();
    const n = tail ? Number(tail) : NaN;
    if (!Number.isNaN(n)) seq = n + 1;
  }
  return `INV-${yy}-${seq.toString().padStart(6, "0")}`;
};

export const createInvoice = async (req: Request, res: Response) => {
  const parsed = invoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", issues: parsed.error.errors.map((e) => e.message) });
  }
  const { studentId, total, dueDate, status } = parsed.data;
  const { termId } = await getOrCreateActiveYearTerm();
  const invoiceNo = await nextInvoiceNo();
  const invoice = await prisma.invoice.create({
    data: {
      studentId,
      termId,
      invoiceNo,
      total,
      status: status ?? InvoiceStatus.ISSUED,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  res.status(201).json({ data: invoice });
};

export const recordPayment = async (req: Request, res: Response) => {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed", issues: parsed.error.errors.map((e) => e.message) });
  }
  const { invoiceId, amount, method, reference } = parsed.data;
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { payments: true } });
  if (!invoice) return res.status(404).json({ message: "Invoice not found" });

  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      amount,
      method,
      reference,
    },
  });

  // Update invoice status based on total paid
  const paidTotal = invoice.payments.reduce((acc, p) => acc + Number(p.amount), 0) + amount;
  let newStatus = InvoiceStatus.PARTIAL;
  if (paidTotal >= Number(invoice.total)) newStatus = InvoiceStatus.PAID;
  await prisma.invoice.update({ where: { id: invoiceId }, data: { status: newStatus } });

  res.status(201).json({ data: payment });
};

export const financeSummary = async (_req: Request, res: Response) => {
  const [invoiceAgg, paymentAgg, paidCount, partialCount, overdueCount] = await Promise.all([
    prisma.invoice.aggregate({ _sum: { total: true } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.invoice.count({ where: { status: InvoiceStatus.PAID } }),
    prisma.invoice.count({ where: { status: InvoiceStatus.PARTIAL } }),
    prisma.invoice.count({ where: { status: InvoiceStatus.OVERDUE } }),
  ]);

  const totalBilled = Number(invoiceAgg._sum.total ?? 0);
  const collected = Number(paymentAgg._sum.amount ?? 0);
  const pending = Math.max(totalBilled - collected, 0);

  res.status(200).json({
    totalBilled,
    collected,
    pending,
    paidCount,
    partialCount,
    overdueCount,
  });
};
