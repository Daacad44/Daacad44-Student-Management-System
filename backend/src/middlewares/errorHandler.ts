import { NextFunction, Request, Response } from "express";
import logger from "@/config/logger";

// Basic not-found responder
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ message: "Not found" });
};

// Centralized error handler
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  const status = err?.status || 500;
  const message = err?.message || "Internal server error";
  res.status(status).json({ message });
};
