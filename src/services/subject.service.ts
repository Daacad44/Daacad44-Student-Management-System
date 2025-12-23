import prisma from "@/lib/prisma";
import { z } from "zod";

export const subjectCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  department: z.string().optional(),
});

export const subjectUpdateSchema = subjectCreateSchema.partial();

export const listSubjects = async () =>
  prisma.subject.findMany({
    orderBy: { id: "desc" },
  });

export const createSubject = async (input: z.infer<typeof subjectCreateSchema>) =>
  prisma.subject.create({
    data: {
      name: input.name,
      code: input.code,
      department: input.department,
    },
  });

export const updateSubject = async (id: number, input: z.infer<typeof subjectUpdateSchema>) => {
  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject) {
    const error = new Error("Subject not found");
    // @ts-expect-error custom status
    error.status = 404;
    throw error;
  }

  return prisma.subject.update({
    where: { id },
    data: {
      name: input.name ?? subject.name,
      code: input.code ?? subject.code,
      department: input.department ?? subject.department,
    },
  });
};

export const deleteSubject = async (id: number) => {
  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject) {
    const error = new Error("Subject not found");
    // @ts-expect-error custom status
    error.status = 404;
    throw error;
  }
  await prisma.subject.delete({ where: { id } });
  return { id };
};
