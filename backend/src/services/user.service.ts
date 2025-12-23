import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const userCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.string().min(2),
});

export const listUsers = async () => {
  const users = await prisma.user.findMany({
    orderBy: { id: "desc" },
    include: { roles: { include: { role: true } } },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    roles: u.roles.map((r) => r.role.name),
    status: u.status,
    createdAt: u.createdAt,
  }));
};

export const createUser = async (input: z.infer<typeof userCreateSchema>) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    const error = new Error("Email already exists");
    // @ts-expect-error custom status
    error.status = 409;
    throw error;
  }

  const role = await prisma.role.upsert({
    where: { name: input.role },
    update: {},
    create: { name: input.role },
  });

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      roles: { create: [{ roleId: role.id }] },
    },
    include: { roles: { include: { role: true } } },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles.map((r) => r.role.name),
  };
};
