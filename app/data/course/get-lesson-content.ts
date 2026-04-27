import "server-only";
import { requireUser } from "../user/require-user";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { cache } from "react";

export const getLessonContent = cache(async (lessonId: string) => {
  const session = await requireUser();

  const lesson = await prisma.lesson.findUnique({
    where: {
      id: lessonId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailKey: true,
      videoKey: true,
      resourceKey: true,
      resourceName: true,
      position: true,
      type: true,
      quiz: {
        include: {
          questions: {
            include: {
              options: true,
              userAnswers: {
                where: {
                  userId: session.id,
                },
              },
            },
          },
        },
      },
      lessonProgress: {
        where: {
          userId: session.id,
        },
        select: {
          completed: true,
          lessonId: true,
        },
      },
      Chapter: {
        select: {
          courseId: true,
          Course: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    return notFound();
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.id,
        courseId: lesson.Chapter.courseId,
      },
    },
    select: {
      status: true,
    },
  });

  if (!enrollment || enrollment.status !== "Active") {
    return notFound();
  }
  return lesson;
});

export type LessonContentType = Awaited<ReturnType<typeof getLessonContent>>;
