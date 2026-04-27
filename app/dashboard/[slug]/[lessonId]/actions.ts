"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";
import Groq from "groq-sdk";
import { addXP } from "@/lib/xp-system";
import { ActivityType } from "@/lib/generated/prisma";

export async function markLessonComplete(
  lessonId: string,
  slug: string
): Promise<ApiResponse> {
  const session = await requireUser();

  try {
    const existingProgress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId: lessonId,
        },
      },
    });

    if (!existingProgress?.completed) {
      await addXP(session.id, ActivityType.LESSON_COMPLETED);
    }

    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId: lessonId,
        },
      },
      update: {
        completed: true,
      },
      create: {
        lessonId: lessonId,
        userId: session.id,
        completed: true,
      },
    });

    revalidatePath(`/dashboard/${slug}`);

    return {
      status: "success",
      message: "Progress updated",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to mark lesson as complete",
    };
  }
}

export async function submitQuizAnswers(
  lessonId: string,
  quizId: string,
  answers: Record<string, string[]>,
  slug: string
): Promise<ApiResponse & { score?: number; total?: number; evaluations?: Record<string, { isCorrect: boolean; feedback?: string }> }> {
  const session = await requireUser();

  try {
    // Check if the user has already answered this quiz
    const existingAnswers = await prisma.userAnswer.findMany({
      where: {
        userId: session.id,
        question: { quizId: quizId },
      },
    });

    // If retries are allowed, we can delete existing and insert new ones
    if (existingAnswers.length > 0) {
      await prisma.userAnswer.deleteMany({
        where: {
          userId: session.id,
          question: { quizId: quizId },
        },
      });
    }

    // Evaluate score
    const questions = await prisma.question.findMany({
      where: { quizId: quizId },
      include: { options: true },
    });

    let score = 0;
    const total = questions.length;
    const userAnswersToInsert = [];
    const evaluations: Record<string, { isCorrect: boolean; feedback?: string }> = {};

    for (const question of questions) {
      const selectedOptionIds = answers[question.id];
      if (!selectedOptionIds || selectedOptionIds.length === 0) continue; // Skip unanswered

      let isCorrect = false;

      if (question.type === "MULTIPLE_CHOICE" || question.type === "MULTIPLE_SELECT") {
        const correctOptionIds = question.options.filter(o => o.isCorrect).map(o => o.id);
        isCorrect = selectedOptionIds.length === correctOptionIds.length && 
                          selectedOptionIds.every(id => correctOptionIds.includes(id));

        for (const id of selectedOptionIds) {
          userAnswersToInsert.push({
            userId: session.id,
            questionId: question.id,
            selectedOptionId: id,
            isCorrect,
          });
        }
        evaluations[question.id] = { isCorrect };
      } else if (question.type === "NUMERICAL" || question.type === "FILL_IN_THE_BLANK") {
        // NUMERICAL or FILL_IN_THE_BLANK
        const userInput = selectedOptionIds[0]?.trim().toLowerCase() || "";
        
        // Find if any correct option matches the text
        const correctOptions = question.options.filter(o => o.isCorrect);
        isCorrect = correctOptions.some(o => o.text.trim().toLowerCase() === userInput);

        userAnswersToInsert.push({
          userId: session.id,
          questionId: question.id,
          textAnswer: selectedOptionIds[0] || "",
          isCorrect,
        });
        evaluations[question.id] = { isCorrect };
      } else if (question.type === "THEORY") {
        const userInput = selectedOptionIds[0] || "";
        let feedbackText = "";
        
        try {
          if (process.env.Anshlms_groc_API) {
            const groq = new Groq({ apiKey: process.env.Anshlms_groc_API });
            const modelName = "llama-3.3-70b-versatile";
            
            const correctOptions = question.options.filter(o => o.isCorrect).map(o => o.text).join("\\n");
            
            const prompt = `You are a strict but fair AI grader for an online course.
Question: """${question.questionText}"""
${correctOptions ? `Reference Answer/Rubric: """${correctOptions}"""\\n` : ''}Student's Answer: """${userInput}"""

Carefully analyze the Question and evaluate if the Student's Answer is correct.${correctOptions ? ' Use the Reference Answer as a guideline if provided.' : ''}
Respond ONLY with a valid JSON in the following format, with no markdown formatting or block backticks:
{
  "isCorrect": boolean,
  "feedback": "string, a brief explanation of why the answer is correct or incorrect. If incorrect, explain what they missed."
}`;

            console.log(`[AI Grading] Sending prompt using Groq model: ${modelName}`);
            try {
              const result = await groq.chat.completions.create({
                model: modelName,
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
              });
              
              const aiResponseText = result.choices[0]?.message?.content?.trim() || "";
              
              if (!aiResponseText) {
                throw new Error(`Empty text string from ${modelName}`);
              }
              
              // Safe JSON parsing
              let parsedResult = { isCorrect: false, feedback: "Failed to parse AI response." };
              try {
                const cleanedText = aiResponseText.replace(/^```json/im, '').replace(/```$/m, '').trim();
                parsedResult = JSON.parse(cleanedText);
              } catch (parseError) {
                console.error(`[AI Grading] JSON Parse Error:`, aiResponseText);
                throw new Error("JSON Parse Error");
              }
              
              isCorrect = Boolean(parsedResult.isCorrect);
              feedbackText = parsedResult.feedback || "";
            } catch (err: any) {
              console.error(`[AI Grading] Groq Model failed:`, err.message || err);
              throw err;
            }
          } else {
            console.error("Missing Anshlms_groc_API in environment variables.");
            isCorrect = false;
            feedbackText = "AI grading unavailable.";
          }
        } catch (err) {
          console.error("Groq grading error:", err);
          isCorrect = false;
          feedbackText = "Error during AI evaluation.";
        }

        userAnswersToInsert.push({
          userId: session.id,
          questionId: question.id,
          textAnswer: userInput,
          isCorrect,
          feedback: feedbackText,
        });
        evaluations[question.id] = { isCorrect, feedback: feedbackText };
      }

      if (isCorrect) {
        score++;
      }
    }

    // Insert new answers
    if (userAnswersToInsert.length > 0) {
      await prisma.userAnswer.createMany({
        data: userAnswersToInsert,
      });
    }

    // Mark lesson complete and award XP if not already completed
    const existingProgress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId: lessonId,
        },
      },
    });

    if (!existingProgress?.completed) {
      if (total > 0 && score >= total * 0.5) {
        await addXP(session.id, ActivityType.QUIZ_PASSED);
      } else {
        await addXP(session.id, ActivityType.LESSON_COMPLETED);
      }
    }

    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId: lessonId,
        },
      },
      update: {
        completed: true,
      },
      create: {
        lessonId: lessonId,
        userId: session.id,
        completed: true,
      },
    });

    revalidatePath(`/dashboard/${slug}`);
    revalidatePath(`/dashboard/${slug}/${lessonId}`);

    return {
      status: "success",
      message: "Quiz submitted successfully",
      score,
      total,
      evaluations,
    };
  } catch (error) {
    return {
      status: "error",
      message: "Failed to submit quiz",
    };
  }
}

export async function askLessonDoubt(lessonId: string, query: string, history: Array<{role: "user" | "bot" | "model", content: string}>) {
  const session = await requireUser();
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }});
  
  if (!lesson || lesson.type === "QUIZ") return { error: "Chatbot not available here." };

  try {
    if (!process.env.Anshlms_groc_API) {
      return { error: "AI Assistant is currently unavailable." };
    }

    const groq = new Groq({ apiKey: process.env.Anshlms_groc_API });
    const modelName = "llama-3.3-70b-versatile";

    let plainDescription = lesson.description ? JSON.stringify(lesson.description) : "No description provided.";
    
    if (plainDescription.length > 30000) {
      plainDescription = plainDescription.substring(0, 30000) + "... (truncated)";
    }
    
    const systemPrompt = `You are a helpful educational AI assistant.
While you are currently embedded in a specific lesson, you are free to answer questions on ANY educational topic to help the student learn. 
Use the provided lesson context if the question is related to it. If the question is about a different educational topic, answer it to the best of your ability.
If the user asks completely non-educational, inappropriate, or general spam questions (e.g. "tell me a joke", "who is the prime minister"), playfully steer them back to learning.
Keep your answers concise, clear, and perfectly formatted in Markdown.
If the user asks "explain like I'm 5", explain it extremely simply.

Current Lesson Title: ${lesson.title}
Current Lesson Context: ${plainDescription}
`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      })),
      { role: "user", content: query }
    ];

    const result = await groq.chat.completions.create({
      model: modelName,
      messages: messages as any,
    });
    
    const text = result.choices[0]?.message?.content || "No response generated.";
    
    return { response: text };
  } catch (error) {
    console.error("AI Chatbot Error:", error);
    return { error: "Failed to generate response. Please try again." };
  }
}

export async function getGlobalChatMessages(lessonId: string) {
  const session = await requireUser();
  if (!session) return { error: "Not authenticated" };

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { lessonId },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, image: true, email: true } },
      },
      take: 200,
    });
    return { data: messages, sessionUserId: session.id };
  } catch (error) {
    return { error: "Failed to fetch messages." };
  }
}

export async function postGlobalChatMessage(lessonId: string, text: string) {
  const session = await requireUser();
  if (!session) return { error: "Not authenticated" };

  try {
    const newMsg = await prisma.chatMessage.create({
      data: {
        text,
        lessonId,
        userId: session.id,
      },
      include: {
        user: { select: { id: true, name: true, image: true, email: true } },
      },
    });
    return { success: true, data: newMsg };
  } catch (error) {
    return { error: "Failed to post message." };
  }
}

