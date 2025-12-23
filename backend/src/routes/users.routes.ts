import { Router } from "express";
import { authenticate, requireRole } from "@/middlewares/auth.middleware";
import { validateBody } from "@/middlewares/validate.middleware";
import { create, list } from "@/controllers/users.controller";
import { userCreateSchema } from "@/services/user.service";

const router = Router();

router.use(authenticate);
router.use(requireRole(["Super Admin", "School Admin"]));

router.get("/", list);
router.post("/", validateBody(userCreateSchema), create);

export default router;
