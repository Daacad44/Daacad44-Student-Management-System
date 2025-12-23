import prisma from "@/lib/prisma";
import { z } from "zod";

export const classCreateSchema = z.object({
  name: z.string().min(1),
  level: z.string().optional(),
  branch: z.string().optional(),
});

export const sectionCreateSchema = z.object({
  classId: z.number().int().positive(),
  name: z.string().min(1),
});

export const subjectAssignSchema = z.object({
  classId: z.number().int().positive(),
  subjectId: z.number().int().positive(),
  teacherId: z.number().int().positive().optional(),
});

export const listClasses = () =>
  prisma.class.findMany({
    orderBy: { id: "desc" },
    include: {
      sections: true,
      classSubjects: { include: { subject: true, teacher: { include: { user: true } } } },
      _count: { select: { enrollments: true } },
    },
  });

export const createClass = async (input: z.infer<typeof classCreateSchema>) => {
  return prisma.class.create({
    data: { name: input.name, level: input.level, branch: input.branch },
  });
};

export const addSection = async (input: z.infer<typeof sectionCreateSchema>) => {
  return prisma.section.create({
    data: { classId: input.classId, name: input.name },
  });
};

export const assignSubject = async (input: z.infer<typeof subjectAssignSchema>) => {
  const exists = await prisma.classSubject.findFirst({
    where: { classId: input.classId, subjectId: input.subjectId },
  });
  if (exists) {
    return prisma.classSubject.update({
      where: { id: exists.id },
      data: { teacherId: input.teacherId ?? null },
    });
  }
  return prisma.classSubject.create({
    data: {
      classId: input.classId,
      subjectId: input.subjectId,
      teacherId: input.teacherId ?? null,
    },
  });
};
