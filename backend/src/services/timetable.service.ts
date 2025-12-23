import prisma from "@/lib/prisma";
import { getOrCreateActiveYearTerm } from "@/utils/term";
import { z } from "zod";

export const slotCreateSchema = z.object({
  termId: z.number().int().positive().optional(),
  classId: z.number().int().positive(),
  dayOfWeek: z.number().int().min(1).max(7),
  period: z.number().int().min(1),
  subjectId: z.number().int().positive(),
  teacherId: z.number().int().positive().optional(),
  roomId: z.number().int().positive().optional(),
});

export const listSlots = async (classId: number, termId?: number) => {
  const resolvedTermId = termId ?? (await getOrCreateActiveYearTerm()).termId;
  let timetable = await prisma.timetable.findFirst({
    where: { classId, termId: resolvedTermId },
    include: { slots: { include: { subject: true, teacher: { include: { user: true } }, room: true } } },
  });
  if (!timetable) {
    timetable = await prisma.timetable.create({
      data: { classId, termId: resolvedTermId },
      include: { slots: true },
    });
  }
  return timetable;
};

export const createSlot = async (input: z.infer<typeof slotCreateSchema>) => {
  const resolvedTermId = input.termId ?? (await getOrCreateActiveYearTerm()).termId;
  // ensure timetable exists
  let timetable = await prisma.timetable.findFirst({
    where: { classId: input.classId, termId: resolvedTermId },
  });
  if (!timetable) {
    timetable = await prisma.timetable.create({
      data: { classId: input.classId, termId: resolvedTermId },
    });
  }

  const conflicts = await prisma.timetableSlot.findMany({
    where: {
      timetable: { termId: resolvedTermId },
      dayOfWeek: input.dayOfWeek,
      period: input.period,
      OR: [
        { timetable: { classId: input.classId } },
        input.teacherId ? { teacherId: input.teacherId } : undefined,
        input.roomId ? { roomId: input.roomId } : undefined,
      ].filter(Boolean) as any,
    },
    include: { timetable: true, subject: true, teacher: { include: { user: true } }, room: true },
  });

  if (conflicts.length) {
    const error = new Error("Slot conflict detected");
    // @ts-expect-error status
    error.status = 409;
    // @ts-expect-error attach conflicts
    error.conflicts = conflicts;
    throw error;
  }

  return prisma.timetableSlot.create({
    data: {
      timetableId: timetable.id,
      dayOfWeek: input.dayOfWeek,
      period: input.period,
      subjectId: input.subjectId,
      teacherId: input.teacherId ?? null,
      roomId: input.roomId ?? null,
    },
  });
};
