import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import env from "@/config/env";
import logger from "@/config/logger";
import { errorHandler, notFoundHandler } from "@/middlewares/errorHandler";
import router from "@/routes";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN.split(","),
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.use("/api/v1", router);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.on("error", (err) => {
  logger.error(err, "Express error");
});

export default app;
