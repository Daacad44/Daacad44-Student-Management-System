import { Request, Response } from "express";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
} from "@/services/announcement.service";

export const list = async (_req: Request, res: Response) => {
  const data = await listAnnouncements();
  res.json({ data });
};

export const create = async (req: Request, res: Response) => {
  if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });
  const announcement = await createAnnouncement(req.body, req.user.id);
  res.status(201).json({ data: announcement });
};

export const remove = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await deleteAnnouncement(id);
  res.status(204).send();
};
