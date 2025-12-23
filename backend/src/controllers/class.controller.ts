import { Request, Response } from "express";
import {
  addSection,
  assignSubject,
  classCreateSchema,
  createClass,
  listClasses,
  sectionCreateSchema,
  subjectAssignSchema,
} from "@/services/class.service";

export const list = async (_req: Request, res: Response) => {
  const data = await listClasses();
  res.json({ data });
};

export const create = async (req: Request, res: Response) => {
  const cls = await createClass(req.body);
  res.status(201).json({ data: cls });
};

export const createSection = async (req: Request, res: Response) => {
  const sec = await addSection(req.body);
  res.status(201).json({ data: sec });
};

export const assignClassSubject = async (req: Request, res: Response) => {
  const cs = await assignSubject(req.body);
  res.status(201).json({ data: cs });
};
