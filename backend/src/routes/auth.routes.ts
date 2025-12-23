import { Router } from "express";
import { authenticate } from "@/middlewares/auth.middleware";
import { validateBody } from "@/middlewares/validate.middleware";
import { loginSchema, refreshSchema, registerSchema } from "@/services/auth.service";
import { login, logout, me, refresh, register } from "@/controllers/auth.controller";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/refresh", validateBody(refreshSchema), refresh);
router.get("/me", authenticate, me);
router.post("/logout", authenticate, logout);

export default router;
