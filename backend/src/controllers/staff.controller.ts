import { Request, Response } from "express";
import { createStaff, deleteStaff, listStaff, updateStaff } from "@/services/staff.service";

export const list = async (_req: Request, res: Response) => {
  const staff = await listStaff();
  res.json({ data: staff });
};

export const create = async (req: Request, res: Response) => {
  const staff = await createStaff(req.body);
  res.status(201).json({ data: staff });
};

export const update = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const staff = await updateStaff(id, req.body);
  res.json({ data: staff });
};

export const remove = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await deleteStaff(id);
  res.status(204).send();
};
