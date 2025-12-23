import prisma from "@/lib/prisma";
import { getOrCreateActiveYearTerm } from "@/utils/term";
import { parse } from "csv-parse/sync";
import bcrypt from "bcrypt";
import ExcelJS from "exceljs";
import { Parser as Json2CsvParser } from "json2csv";
import { z } from "zod";

export const studentCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gender: z.string().min(1),
  dob: z.string().optional(), // accept plain date strings like YYYY-MM-DD
  address: z.string().optional(),
  status: z.string().default("active"),
  classId: z.number().int().positive().optional(),
  sectionId: z.number().int().positive().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().optional(),
  guardianAddress: z.string().optional(),
});

type StudentCreateInput = z.infer<typeof studentCreateSchema>;

export const studentUpdateSchema = studentCreateSchema.partial();

export const listStudents = async (params: {
  search?: string;
  status?: string;
  classId?: number;
  page?: number;
  pageSize?: number;
}) => {
  const page = Math.max(params.page || 1, 1);
  const pageSize = Math.min(Math.max(params.pageSize || 20, 1), 100);
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (params.status) {
    where.status = params.status;
  }
  if (params.search) {
    where.OR = [
      { firstName: { contains: params.search, mode: "insensitive" } },
      { lastName: { contains: params.search, mode: "insensitive" } },
      { studentCode: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params.classId) {
    where.enrollments = { some: { classId: params.classId } };
  }

  const [total, data] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take: pageSize,
      include: {
        enrollments: {
          include: {
            class: true,
            section: true,
            academicYear: true,
            term: true,
          },
        },
      },
    }),
  ]);

  return { data, total, page, pageSize };
};

const nextStudentCode = async () => {
  const yy = new Date().getFullYear().toString().slice(-2);
  const last = await prisma.student.findFirst({
    where: { studentCode: { startsWith: `SCH-${yy}-` } },
    orderBy: { studentCode: "desc" },
    select: { studentCode: true },
  });

  let nextSeq = 1;
  if (last?.studentCode) {
    const tail = last.studentCode.split("-").pop();
    const n = tail ? Number(tail) : NaN;
    if (!Number.isNaN(n)) nextSeq = n + 1;
  }

  const seq = nextSeq.toString().padStart(6, "0");
  return `SCH-${yy}-${seq}`;
};

export const createStudent = async (input: StudentCreateInput) => {
  const normalizedStatus = input.status ? input.status.toLowerCase() : "active";

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = await nextStudentCode();
    try {
      const student = await prisma.student.create({
        data: {
          studentCode: code,
          firstName: input.firstName,
          lastName: input.lastName,
          gender: input.gender,
          dob: input.dob ? new Date(input.dob) : undefined,
          address: input.address,
          status: normalizedStatus,
        },
      });

      if (input.guardianName || input.guardianPhone || input.guardianEmail) {
        const guardian = await prisma.guardian.create({
          data: {
            name: input.guardianName || "Guardian",
            phone: input.guardianPhone || "",
            email: input.guardianEmail,
            address: input.guardianAddress,
          },
        });
        await prisma.studentGuardian.create({
          data: { studentId: student.id, guardianId: guardian.id, relation: "Guardian" },
        });
      }

      // auto-enroll if class provided
      if (input.classId) {
        const { academicYearId, termId } = await getOrCreateActiveYearTerm();
        await prisma.enrollment.create({
          data: {
            studentId: student.id,
            classId: input.classId,
            sectionId: input.sectionId ?? null,
            academicYearId,
            termId,
          },
        });
      }

      return student;
    } catch (err: any) {
      // P2002 is Prisma unique constraint error
      if (err?.code === "P2002" && attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        continue;
      }
      throw err;
    }
  }

  throw new Error("Could not generate unique student code");
};

type CsvRow = {
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: string;
  dob?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianAddress?: string;
  status?: string;
  class?: string;
  section?: string;
};

const randomPassword = () => Math.random().toString(36).slice(2, 10) + "A1!";

const pick = (row: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (value === undefined || value === null) continue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    } else {
      return value as string;
    }
  }
  return undefined;
};

export const importStudentsFromCsv = async (csvBuffer: Buffer) => {
  const rows = parse(csvBuffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];

  const { academicYearId, termId } = await getOrCreateActiveYearTerm();
  const classCache = new Map<string, number>();
  const sectionCache = new Map<string, number>();

  const studentRole = await prisma.role.upsert({
    where: { name: "Student" },
    update: {},
    create: { name: "Student" },
  });

  const created: { studentId: number; studentCode: string; email?: string; tempPassword?: string }[] = [];

  const getClassId = async (name: string) => {
    const key = name.toLowerCase();
    const cached = classCache.get(key);
    if (cached) return cached;
    const existing = await prisma.class.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (existing) {
      classCache.set(key, existing.id);
      return existing.id;
    }
    const createdClass = await prisma.class.create({ data: { name } });
    classCache.set(key, createdClass.id);
    return createdClass.id;
  };

  const getSectionId = async (classId: number, name: string) => {
    const key = `${classId}:${name.toLowerCase()}`;
    const cached = sectionCache.get(key);
    if (cached) return cached;
    const existing = await prisma.section.findFirst({
      where: { classId, name: { equals: name, mode: "insensitive" } },
    });
    if (existing) {
      sectionCache.set(key, existing.id);
      return existing.id;
    }
    const createdSection = await prisma.section.create({ data: { classId, name } });
    sectionCache.set(key, createdSection.id);
    return createdSection.id;
  };

  for (const row of rows) {
    let firstName =
      pick(row, ["firstName", "firstname", "first_name", "First Name", "FirstName", "name", "Name", "Full Name"]) as
        | string
        | undefined;
    let lastName = pick(row, ["lastName", "lastname", "last_name", "Last Name", "LastName", "Surname"]) as
      | string
      | undefined;

    if (!lastName && firstName && firstName.includes(" ")) {
      const parts = firstName.split(/\s+/);
      firstName = parts.shift();
      lastName = parts.join(" ") || undefined;
    }

    if (!firstName || !lastName) continue;

    const email = pick(row, ["email", "Email", "E-mail", "userEmail"]) as string | undefined;
    const gender = (pick(row, ["gender", "Gender"]) as string | undefined) || "Unspecified";
    const dobRaw = pick(row, ["dob", "DOB", "dateOfBirth", "Date of Birth"]) as string | undefined;
    const address = pick(row, ["address", "Address"]) as string | undefined;
    const status = (pick(row, ["status", "Status"]) as string | undefined) ?? "active";

    const className = pick(row, ["class", "Class", "className", "Class Name"]) as string | undefined;
    const sectionName = pick(row, ["section", "Section", "sectionName", "Section Name"]) as string | undefined;
    const guardianName = pick(row, ["guardianName", "Guardian Name", "parentName", "Parent Name"]) as
      | string
      | undefined;
    const guardianPhone = pick(row, ["guardianPhone", "Guardian Phone", "parentPhone", "Parent Phone"]) as
      | string
      | undefined;
    const guardianEmail = pick(row, ["guardianEmail", "Guardian Email", "parentEmail", "Parent Email"]) as
      | string
      | undefined;
    const guardianAddress = pick(row, ["guardianAddress", "Guardian Address", "parentAddress", "Parent Address"]) as
      | string
      | undefined;

    const code = await nextStudentCode();
    const student = await prisma.student.create({
      data: {
        studentCode: code,
        firstName,
        lastName,
        gender,
        dob: dobRaw ? new Date(dobRaw) : undefined,
        address,
        status: status.toLowerCase(),
      },
    });

    if (guardianName || guardianPhone || guardianEmail) {
      const guardian = await prisma.guardian.create({
        data: {
          name: guardianName || "Guardian",
          phone: guardianPhone || "",
          email: guardianEmail,
          address: guardianAddress,
        },
      });
      await prisma.studentGuardian.create({
        data: { studentId: student.id, guardianId: guardian.id, relation: "Guardian" },
      });
    }

    if (className) {
      const classId = await getClassId(className);
      const sectionId = sectionName ? await getSectionId(classId, sectionName) : undefined;
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          classId,
          sectionId: sectionId ?? null,
          academicYearId,
          termId,
        },
      });
    }

    let tempPassword: string | undefined;
    if (email) {
      tempPassword = randomPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      await prisma.user.upsert({
        where: { email },
        update: {
          passwordHash,
          name: `${firstName} ${lastName}`,
        },
        create: {
          email,
          name: `${firstName} ${lastName}`,
          passwordHash,
          roles: { create: [{ roleId: studentRole.id }] },
        },
      });
    }

    created.push({ studentId: student.id, studentCode: student.studentCode, email, tempPassword });
  }

  return { count: created.length, students: created };
};

export const getStudentById = (id: number) =>
  prisma.student.findUnique({
    where: { id },
    include: {
      enrollments: {
        include: { class: true, section: true, academicYear: true, term: true },
      },
      guardians: { include: { guardian: true } },
    },
  });

export const studentSummary = async () => {
  const now = new Date();
  const currentYearStart = new Date(now.getFullYear(), 0, 1);

  const [total, active, graduated, newThisYear] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: "active" } }),
    prisma.student.count({ where: { status: "graduated" } }),
    prisma.enrollment.count({ where: { createdAt: { gte: currentYearStart } } }),
  ]);

  return { total, active, graduated, newThisYear };
};

export const updateStudent = async (id: number, input: Partial<StudentCreateInput>) => {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error("Student not found");
    // @ts-expect-error custom status
    error.status = 404;
    throw error;
  }
  const normalizedStatus = input.status ? input.status.toLowerCase() : existing.status;
  const updated = await prisma.student.update({
    where: { id },
    data: {
      firstName: input.firstName ?? existing.firstName,
      lastName: input.lastName ?? existing.lastName,
      gender: input.gender ?? existing.gender,
      dob: input.dob ? new Date(input.dob) : existing.dob,
      address: input.address ?? existing.address,
      status: normalizedStatus,
    },
  });

  if (input.guardianName || input.guardianPhone || input.guardianEmail || input.guardianAddress) {
    const link = await prisma.studentGuardian.findFirst({
      where: { studentId: id },
      include: { guardian: true },
    });
    if (link) {
      await prisma.guardian.update({
        where: { id: link.guardianId },
        data: {
          name: input.guardianName ?? link.guardian.name,
          phone: input.guardianPhone ?? link.guardian.phone,
          email: input.guardianEmail ?? link.guardian.email,
          address: input.guardianAddress ?? link.guardian.address,
        },
      });
    } else {
      const guardian = await prisma.guardian.create({
        data: {
          name: input.guardianName || "Guardian",
          phone: input.guardianPhone || "",
          email: input.guardianEmail,
          address: input.guardianAddress,
        },
      });
      await prisma.studentGuardian.create({
        data: { studentId: id, guardianId: guardian.id, relation: "Guardian" },
      });
    }
  }

  if (input.classId) {
    const { academicYearId, termId } = await getOrCreateActiveYearTerm();
    const currentEnrollment = await prisma.enrollment.findFirst({
      where: { studentId: id, academicYearId, termId, classId: input.classId },
    });
    if (currentEnrollment) {
      if (input.sectionId !== undefined) {
        await prisma.enrollment.update({
          where: { id: currentEnrollment.id },
          data: { sectionId: input.sectionId ?? null },
        });
      }
    } else {
      await prisma.enrollment.create({
        data: {
          studentId: id,
          classId: input.classId,
          sectionId: input.sectionId ?? null,
          academicYearId,
          termId,
        },
      });
    }
  }

  return updated;
};

export const deleteStudent = async (id: number) => {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error("Student not found");
    // @ts-expect-error custom status
    error.status = 404;
    throw error;
  }
  await prisma.student.delete({ where: { id } });
  return { id };
};

export const enrollStudent = async (studentId: number, classId: number, sectionId?: number) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    const error = new Error("Student not found");
    // @ts-expect-error custom status
    error.status = 404;
    throw error;
  }
  const { academicYearId, termId } = await getOrCreateActiveYearTerm();
  return prisma.enrollment.create({
    data: {
      studentId,
      classId,
      sectionId: sectionId ?? null,
      academicYearId,
      termId,
    },
  });
};

const studentExportFields = [
  "studentCode",
  "firstName",
  "lastName",
  "gender",
  "dob",
  "address",
  "status",
];

export const exportStudents = async (format: "csv" | "xlsx") => {
  const students = await prisma.student.findMany({
    orderBy: { id: "asc" },
    select: {
      studentCode: true,
      firstName: true,
      lastName: true,
      gender: true,
      dob: true,
      address: true,
      status: true,
    },
  });

  if (format === "csv") {
    const parser = new Json2CsvParser({ fields: studentExportFields });
    const csv = parser.parse(
      students.map((s) => ({
        ...s,
        dob: s.dob ? s.dob.toISOString().split("T")[0] : "",
      })),
    );
    return { contentType: "text/csv", data: Buffer.from(csv, "utf-8"), filename: "students.csv" };
  }

  // XLSX
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Students");
  sheet.columns = studentExportFields.map((key) => ({ header: key, key, width: 16 }));
  sheet.addRows(
    students.map((s) => ({
      ...s,
      dob: s.dob ? s.dob.toISOString().split("T")[0] : "",
    })),
  );
  const buffer = await workbook.xlsx.writeBuffer();
  return {
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    data: Buffer.from(buffer),
    filename: "students.xlsx",
  };
};
