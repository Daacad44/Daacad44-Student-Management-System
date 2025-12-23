import bcrypt from "bcrypt";
import dotenv from "dotenv";
import prisma from "../src/lib/prisma";

dotenv.config({ path: ".env" });

const defaultRoles = [
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
];

const defaultPermissions = [
  "student.create",
  "student.read",
  "student.update",
  "attendance.take",
  "attendance.report",
  "exam.publish",
  "fees.collect",
  "fees.invoice",
  "announcement.create",
  "announcement.read",
];

async function seedRoles() {
  for (const name of defaultRoles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

async function seedPermissions() {
  for (const key of defaultPermissions) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key },
    });
  }
}

async function linkRolePermissions(roleName: string) {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) return;

  const permissions = await prisma.permission.findMany({
    where: { key: { in: defaultPermissions } },
  });

  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
      update: {},
      create: { roleId: role.id, permissionId: perm.id },
    });
  }
}

async function seedSuperAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@sms.local";
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const name = "Super Admin";

  const role = await prisma.role.upsert({
    where: { name: "Super Admin" },
    update: {},
    create: { name: "Super Admin" },
  });

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      passwordHash,
      roles: {
        create: [{ roleId: role.id }],
      },
    },
  });
}

async function main() {
  await seedRoles();
  await seedPermissions();
  await linkRolePermissions("Super Admin");
  await seedSuperAdmin();
  // eslint-disable-next-line no-console
  console.log("Seed completed");
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
