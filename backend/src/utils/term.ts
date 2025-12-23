import prisma from "@/lib/prisma";

export const getOrCreateActiveYearTerm = async () => {
  let year = await prisma.academicYear.findFirst({ where: { active: true } });
  if (!year) {
    const start = new Date(new Date().getFullYear(), 0, 1);
    const end = new Date(new Date().getFullYear(), 11, 31);
    year = await prisma.academicYear.create({
      data: { name: `${new Date().getFullYear()}`, startDate: start, endDate: end, active: true },
    });
  }

  let term = await prisma.term.findFirst({ where: { academicYearId: year.id, active: true } });
  if (!term) {
    term = await prisma.term.create({
      data: {
        academicYearId: year.id,
        name: "Term 1",
        startDate: year.startDate,
        endDate: year.endDate,
        active: true,
      },
    });
  }

  return { academicYearId: year.id, termId: term.id };
};
