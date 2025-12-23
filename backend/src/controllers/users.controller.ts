import { Request, Response } from "express";
import { createUser, listUsers, userCreateSchema } from "@/services/user.service";

export const list = async (_req: Request, res: Response) => {
  const users = await listUsers();
  res.json({ data: users });
};

export const create = async (req: Request, res: Response) => {
  // validation handled in route via validateBody
  const user = await createUser(req.body);
  res.status(201).json({ data: user });
};
