import "server-only";
import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";
import { notFound } from "next/navigation";

export async function adminGetLesson(id: string) {
  await requireAdmin();

  const data = await prisma.lesson.findUnique({
    where: {
      id: id,
    },
    select: {
      title: true,
      videoKey: true,
      thumbnailKey: true,
      resourceKey: true,
      resourceName: true,
      description: true,
      id: true,
      position: true,
      type: true,
      quiz: {
        select: {
          questions: {
            select: {
              id: true,
              questionText: true,
              type: true,
              options: {
                select: {
                  id: true,
                  text: true,
                  isCorrect: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!data) {
    return notFound();
  }

  return data;
}

export type AdminLessonType = Awaited<ReturnType<typeof adminGetLesson>>;
