import { Request, Response } from "express";
import { createSubject, deleteSubject, listSubjects, updateSubject } from "@/services/subject.service";

export const list = async (_req: Request, res: Response) => {
  const subjects = await listSubjects();
  res.json({ data: subjects });
};

export const create = async (req: Request, res: Response) => {
  try {
    const subject = await createSubject(req.body);
    res.status(201).json({ data: subject });
  } catch (err: any) {
    const message = err?.message || "Failed to create subject";
    const status = err?.status || 500;
    res.status(status).json({ message });
  }
};

export const update = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const subject = await updateSubject(id, req.body);
    res.json({ data: subject });
  } catch (err: any) {
    const message = err?.message || "Failed to update subject";
    const status = err?.status || 500;
    res.status(status).json({ message });
  }
};

export const remove = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await deleteSubject(id);
  res.status(204).send();
};
