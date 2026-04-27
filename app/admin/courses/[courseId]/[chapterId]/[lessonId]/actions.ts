"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
import { revalidatePath } from "next/cache";
import Groq from "groq-sdk";

export async function updateLesson(
  values: LessonSchemaType,
  lessonId: string
): Promise<ApiResponse> {
  await requireAdmin();

  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      console.error("[updateLesson] Invalid data:", result.error.errors);
      return {
        status: "error",
        message: "Invalid data — please check all fields and try again.",
      };
    }

    // Update the lesson's basic fields
    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: result.data.name,
        description: result.data.description,
        thumbnailKey: result.data.thumbnailKey,
        videoKey: result.data.videoKey,
        resourceKey: result.data.resourceKey,
        resourceName: result.data.resourceName,
        type: result.data.type || "VIDEO",
      },
      select: {
        id: true,
        Chapter: {
          select: {
            courseId: true,
            Course: { select: { slug: true } },
          },
        },
      },
    });

    const courseSlug = updatedLesson.Chapter.Course.slug;
    const courseId = updatedLesson.Chapter.courseId;

    if (result.data.type === "QUIZ" && result.data.questions) {
      // Find the existing quiz (if any) to be able to wipe associated UserAnswers too
      const existingQuiz = await prisma.quiz.findUnique({
        where: { lessonId },
        select: {
          id: true,
          questions: { select: { id: true } },
        },
      });

      if (existingQuiz) {
        const oldQuestionIds = existingQuiz.questions.map((q) => q.id);

        if (oldQuestionIds.length > 0) {
          // Delete UserAnswer rows that reference the old questions so students
          // are not shown stale "you already answered this" state after an admin edit.
          await prisma.userAnswer.deleteMany({
            where: { questionId: { in: oldQuestionIds } },
          });
        }

        // Also reset lesson progress so the quiz shows as incomplete for all students
        await prisma.lessonProgress.deleteMany({
          where: { lessonId },
        });

        // Now delete the quiz (cascades to questions and options via schema)
        await prisma.quiz.deleteMany({ where: { lessonId } });
      }

      if (result.data.questions.length > 0) {
        await prisma.quiz.create({
          data: {
            title: result.data.name,
            lessonId: lessonId,
            questions: {
              create: result.data.questions.map((q) => ({
                questionText: q.questionText,
                type: q.type || "MULTIPLE_CHOICE",
                options: {
                  create: q.options
                    .filter((o, index) => {
                      if (["FILL_IN_THE_BLANK", "NUMERICAL", "THEORY"].includes(q.type || "")) {
                        return index === 0; // Only keep the first option
                      }
                      return o.text.trim() !== ""; // Discard any empty leftover options
                    })
                    .map((o) => ({
                      text: o.text,
                      isCorrect: ["FILL_IN_THE_BLANK", "NUMERICAL", "THEORY"].includes(q.type || "")
                        ? true
                        : (o.isCorrect ?? false),
                    })),
                },
              })),
            },
          },
        });
      }
    }

    // Bust Next.js cache so students immediately see the updated quiz/lesson
    revalidatePath(`/dashboard/${courseSlug}`, "layout");
    revalidatePath(`/dashboard/${courseSlug}/${lessonId}`);
    revalidatePath(`/admin/courses/${courseId}`, "layout");

    return {
      status: "success",
      message: `"${result.data.name}" saved successfully!`,
    };
  } catch (err) {
    console.error("[updateLesson] error:", err);
    return {
      status: "error",
      message: "Failed to save the lesson. Please try again.",
    };
  }
}

export async function generateQuizQuestions(
  topic: string,
  count: number,
  context?: string,
) {
  await requireAdmin();

  try {
    if (!process.env.Anshlms_groc_API) {
      return { status: "error", message: "AI Assistant configuration is missing." };
    }

    const groq = new Groq({ apiKey: process.env.Anshlms_groc_API });
    const modelName = "llama-3.3-70b-versatile";

    const prompt = `You are an expert educational content creator.
Generate ${count} quiz questions about "${topic}".
${context ? `Use the following context to help generate questions:\\n${context}\\n` : ""}

The questions must be appropriate for a learning management system.
Include a mix of different question types if possible (but primarily Multiple Choice and Multiple Select are easiest).
Valid types are: "MULTIPLE_CHOICE", "MULTIPLE_SELECT", "NUMERICAL", "FILL_IN_THE_BLANK", "THEORY".

Respond ONLY with a valid JSON object in the following exact format, with no markdown formatting or block backticks:
{
  "questions": [
    {
      "questionText": "string",
      "type": "MULTIPLE_CHOICE" | "MULTIPLE_SELECT" | "NUMERICAL" | "FILL_IN_THE_BLANK" | "THEORY",
      "options": [
        {
          "text": "string",
          "isCorrect": boolean
        }
      ]
    }
  ]
}

Instructions for options by type:
- MULTIPLE_CHOICE: Provide 3-5 options. Exactly ONE option must have isCorrect: true.
- MULTIPLE_SELECT: Provide 4-6 options. At least TWO options must have isCorrect: true.
- NUMERICAL: Provide exactly ONE option. The text must be a number string (e.g. "42"). isCorrect must be true.
- FILL_IN_THE_BLANK: Provide exactly ONE option. The text should be the exact word/phrase. isCorrect must be true.
- THEORY: Provide exactly ONE option. The text should be the reference grading rubric or model answer. isCorrect must be true.
`;

    const result = await groq.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    
    const aiResponseText = result.choices[0]?.message?.content?.trim() || "";
    
    if (!aiResponseText) {
      throw new Error(`Empty text string from ${modelName}`);
    }
    
    const cleanedText = aiResponseText.replace(/^```json/im, '').replace(/```$/m, '').trim();
    const parsedResult = JSON.parse(cleanedText);

    return {
      status: "success",
      questions: parsedResult.questions,
    };
  } catch (err: any) {
    console.error("[generateQuizQuestions] error:", err);
    return {
      status: "error",
      message: "Failed to generate AI questions. Please try again.",
    };
  }
}

