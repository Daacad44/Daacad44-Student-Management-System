import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const staffCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  joinDate: z.string().optional(), // YYYY-MM-DD
  role: z.string().default("Teacher"),
});

export const staffUpdateSchema = staffCreateSchema.partial();

const randomPassword = () => Math.random().toString(36).slice(2, 10) + "A1!";

const nextStaffCode = async () => {
  const yy = new Date().getFullYear().toString().slice(-2);
  const last = await prisma.staff.findFirst({
    where: { staffCode: { startsWith: `STF-${yy}-` } },
    orderBy: { staffCode: "desc" },
    select: { staffCode: true },
  });

  let nextSeq = 1;
  if (last?.staffCode) {
    const tail = last.staffCode.split("-").pop();
    const n = tail ? Number(tail) : NaN;
    if (!Number.isNaN(n)) nextSeq = n + 1;
  }

  const seq = nextSeq.toString().padStart(6, "0");
  return `STF-${yy}-${seq}`;
};

export const listStaff = async () => {
  const staff = await prisma.staff.findMany({
    orderBy: { id: "desc" },
    include: {
      user: { include: { roles: { include: { role: true } } } },
    },
  });

  return staff.map((s) => ({
    id: s.id,
    staffCode: s.staffCode,
    name: s.user.name,
    email: s.user.email,
    phone: s.user.phone,
    department: s.department,
    position: s.position,
    joinDate: s.joinDate,
    roles: s.user.roles.map((r) => r.role.name),
  }));
};

export const createStaff = async (input: z.infer<typeof staffCreateSchema>) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    const error = new Error("Email already exists");
    // @ts-expect-error custom status
    error.status = 409;
    throw error;
  }

  const staffCode = await nextStaffCode();
  const role = await prisma.role.upsert({
    where: { name: input.role },
    update: {},
    create: { name: input.role },
  });

  const tempPassword = randomPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      roles: { create: [{ roleId: role.id }] },
    },
  });

  const staff = await prisma.staff.create({
    data: {
      staffCode,
      userId: user.id,
      department: input.department,
      position: input.position,
      joinDate: input.joinDate ? new Date(input.joinDate) : undefined,
    },
  });

  return { ...staff, name: user.name, email: user.email, phone: user.phone, roles: [role.name], tempPassword };
};

export const updateStaff = async (id: number, input: z.infer<typeof staffUpdateSchema>) => {
  const staff = await prisma.staff.findUnique({ where: { id }, include: { user: true } });
  if (!staff) {
    const error = new Error("Staff not found");
    // @ts-expect-error custom status
    error.status = 404;
    throw error;
  }

  // If email changes, ensure unique
  if (input.email && input.email !== staff.user.email) {
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) {
      const error = new Error("Email already exists");
      // @ts-expect-error custom status
      error.status = 409;
      throw error;
    }
  }

  let roleName: string | undefined;
  if (input.role) {
    const role = await prisma.role.upsert({
      where: { name: input.role },
      update: {},
      create: { name: input.role },
    });
    // ensure user-role link
    const existingLink = await prisma.userRole.findFirst({
      where: { userId: staff.userId, roleId: role.id },
    });
    if (!existingLink) {
      await prisma.userRole.create({ data: { userId: staff.userId, roleId: role.id } });
    }
    roleName = role.name;
  }

  const updatedStaff = await prisma.staff.update({
    where: { id },
    data: {
      department: input.department ?? staff.department,
      position: input.position ?? staff.position,
      joinDate: input.joinDate ? new Date(input.joinDate) : staff.joinDate,
    },
    include: { user: { include: { roles: { include: { role: true } } } } },
  });

  await prisma.user.update({
    where: { id: staff.userId },
    data: {
      name: input.name ?? staff.user.name,
      email: input.email ?? staff.user.email,
      phone: input.phone ?? staff.user.phone,
    },
  });

  return {
    id: updatedStaff.id,
    staffCode: updatedStaff.staffCode,
    name: input.name ?? staff.user.name,
    email: input.email ?? staff.user.email,
    phone: input.phone ?? staff.user.phone,
    department: updatedStaff.department,
    position: updatedStaff.position,
    joinDate: updatedStaff.joinDate,
    roles: roleName
      ? [roleName]
      : updatedStaff.user.roles.map((r) => r.role.name),
  };
};

export const deleteStaff = async (id: number) => {
  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) {
    const error = new Error("Staff not found");
    // @ts-expect-error custom status
    error.status = 404;
    throw error;
  }
  await prisma.staff.delete({ where: { id } });
  // delete user as well to avoid orphan
  await prisma.user.delete({ where: { id: staff.userId } });
  return { id };
};
