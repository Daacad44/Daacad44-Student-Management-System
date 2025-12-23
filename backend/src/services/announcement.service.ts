import prisma from "@/lib/prisma";
import { z } from "zod";

export const announcementCreateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  audienceType: z.string().optional(), // e.g., All, Class, Role, Section
  audienceId: z.number().int().optional(),
});

export const announcementUpdateSchema = announcementCreateSchema.partial();

export const listAnnouncements = async () => {
  return prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: true },
  });
};

export const createAnnouncement = async (
  input: z.infer<typeof announcementCreateSchema>,
  userId: number,
) => {
  return prisma.announcement.create({
    data: {
      title: input.title,
      content: input.content,
      audienceType: input.audienceType || "All",
      audienceId: input.audienceId ?? null,
      createdById: userId,
    },
    include: { createdBy: true },
  });
};

export const deleteAnnouncement = async (id: number) => {
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error("Announcement not found");
    // @ts-expect-error custom status
    error.status = 404;
    throw error;
  }
  await prisma.announcement.delete({ where: { id } });
  return { id };
};
