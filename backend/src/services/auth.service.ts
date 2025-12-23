import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/utils/jwt";

export const allowedRoles = [
  "Super Admin",
  "School Admin",
  "Academic Officer",
  "Finance Officer",
  "HR Officer",
  "Teacher",
  "Student",
  "Parent/Guardian",
  "Librarian",
  "Accountant",
] as const;

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(allowedRoles).default("Super Admin"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;

const sanitizeUser = (user: { id: number; name: string; email: string; roles: { role: Role }[] }) => {
  const roles = user.roles.map((r) => r.role.name);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles,
    isSuperAdmin: roles.includes("Super Admin"),
  };
};

const issueTokens = (payload: { id: number; email: string; roles: string[] }) => ({
  accessToken: signAccessToken(payload),
  refreshToken: signRefreshToken(payload),
});

export const registerUser = async (input: RegisterInput) => {
  if (!allowedRoles.includes(input.role)) {
    const error = new Error("Role not allowed");
    // @ts-expect-error add status for error handler
    error.status = 400;
    throw error;
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    const error = new Error("Email already registered");
    // @ts-expect-error add status for error handler
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const role = await prisma.role.upsert({
    where: { name: input.role },
    update: {},
    create: { name: input.role },
  });

  // If role is Super Admin, ensure it has all permissions linked
  if (role.name === "Super Admin") {
    const permissions = await prisma.permission.findMany();
    for (const perm of permissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      roles: {
        create: [{ roleId: role.id }],
      },
    },
    include: {
      roles: { include: { role: true } },
    },
  });

  const payload = { id: user.id, email: user.email, roles: [role.name] };
  return { user: sanitizeUser(user), ...issueTokens(payload) };
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { roles: { include: { role: true } } },
  });

  if (!user) {
    const error = new Error("Invalid credentials");
    // @ts-expect-error add status for error handler
    error.status = 401;
    throw error;
  }

  const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordValid) {
    const error = new Error("Invalid credentials");
    // @ts-expect-error add status for error handler
    error.status = 401;
    throw error;
  }

  const roles = user.roles.map((r) => r.role.name);
  const payload = { id: user.id, email: user.email, roles };
  return { user: sanitizeUser(user), ...issueTokens(payload) };
};

export const refreshTokens = async (token: string) => {
  try {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { roles: { include: { role: true } } },
    });
    if (!user) {
      const error = new Error("User not found");
      // @ts-expect-error add status for error handler
      error.status = 404;
      throw error;
    }
    const roles = user.roles.map((r) => r.role.name);
    const newPayload = { id: user.id, email: user.email, roles };
    return { ...issueTokens(newPayload) };
  } catch (err) {
    const error = new Error("Invalid refresh token");
    // @ts-expect-error add status for error handler
    error.status = 401;
    throw error;
  }
};

export const getCurrentUser = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });

  if (!user) {
    const error = new Error("User not found");
    // @ts-expect-error add status for error handler
    error.status = 404;
    throw error;
  }

  return sanitizeUser(user);
};
