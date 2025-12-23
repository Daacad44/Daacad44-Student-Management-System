import { Request, Response } from "express";
import * as authService from "@/services/auth.service";

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  const result = await authService.registerUser({ name, email, password, role });
  res.status(201).json(result);
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  res.json(result);
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshTokens(refreshToken);
  res.json(result);
};

export const me = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const profile = await authService.getCurrentUser(req.user.id);
  res.json(profile);
};

export const logout = async (_req: Request, res: Response) => {
  // Stateless JWT: client should drop tokens
  res.json({ message: "Logged out" });
};
