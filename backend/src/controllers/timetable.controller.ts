import { Request, Response } from "express";
import { createSlot, listSlots } from "@/services/timetable.service";

export const getTimetable = async (req: Request, res: Response) => {
  const classId = Number(req.query.classId);
  const termId = req.query.termId ? Number(req.query.termId) : undefined;
  if (!classId) return res.status(400).json({ message: "classId is required" });
  const data = await listSlots(classId, termId);
  res.json({ data });
};

export const addSlot = async (req: Request, res: Response) => {
  try {
    const slot = await createSlot(req.body);
    res.status(201).json({ data: slot });
  } catch (err: any) {
    if (err?.status === 409) {
      return res.status(409).json({ message: err.message, conflicts: err.conflicts });
    }
    throw err;
  }
};
