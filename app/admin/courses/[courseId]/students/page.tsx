import { requireAdmin } from "@/app/data/admin/require-admin";
import { prisma } from "@/lib/db";
import { ArrowLeft, GraduationCap, BrainCircuit, Activity } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Params = Promise<{ courseId: string }>;

export default async function StudentDataPage({ params }: { params: Params }) {
  await requireAdmin();
  const { courseId } = await params;

  // Fetch course with chapters, lessons and quizzes
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      chapter: {
        orderBy: { position: "asc" },
        include: {
          lessons: {
            orderBy: { position: "asc" },
            include: {
              lessonProgress: true,
              quiz: {
                include: {
                  questions: {
                    include: {
                      userAnswers: true,
                      options: true,
                    }
                  }
                }
              }
            }
          }
        }
      },
      enrollment: {
        include: {
          User: {
            select: { id: true, name: true, email: true, image: true, lessonProgress: true }
          }
        }
      }
    }
  });

  if (!course) {
    return <div>Course not found</div>;
  }

  const enrolledUsers = course.enrollment.map(e => e.User);

  // Helper to calculate score of a specific user for a specific quiz
  const getUserQuizScore = (quiz: any, userId: string) => {
    if (!quiz) return { score: 0, total: 0 };
    
    let totalQuestionsWeight = quiz.questions.length;
    let score = 0;
    
    quiz.questions.forEach((q: any) => {
      const userAnsForQ = q.userAnswers.filter((ua: any) => ua.userId === userId);
      
      if (q.type === "MULTIPLE_SELECT") {
        const correctOptions = q.options.filter((o: any) => o.isCorrect).map((o: any) => o.id);
        const userSelectedOptions = userAnsForQ.map((ua: any) => ua.selectedOptionId);
        
        const isCorrect = correctOptions.length === userSelectedOptions.length &&
                          correctOptions.every((id: string) => userSelectedOptions.includes(id));
        if (isCorrect) score++;
      } else {
        if (userAnsForQ.some((ua: any) => ua.isCorrect === true)) {
          score++;
        }
      }
    });

    return { score, total: totalQuestionsWeight };
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/courses`}
          className={buttonVariants({ variant: "outline", size: "icon", className: "rounded-lg" })}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Data</h1>
          <p className="text-muted-foreground">{course.title}</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <GraduationCap className="size-6 text-primary" />
              Chapter Performance
            </CardTitle>
            <CardDescription>
              A high-level view of student progress across each chapter.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {course.chapter.length === 0 ? (
              <p className="text-sm text-muted-foreground">No chapters available.</p>
            ) : (
              <Accordion type="multiple" defaultValue={[course.chapter[0]?.id]} className="w-full">
                {course.chapter.map((chap, i) => {
                  const totalLessons = chap.lessons.length;
                  const quizzesInChapter = chap.lessons.filter(l => l.type === "QUIZ" && l.quiz);

                  return (
                    <AccordionItem value={chap.id} key={chap.id} className="border-b-none mb-4 bg-slate-50 dark:bg-slate-900 rounded-lg group border border-slate-100 dark:border-slate-800">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Chapter {i + 1}</Badge>
                          <span className="font-semibold">{chap.title}</span>
                          <span className="text-xs text-muted-foreground font-normal ml-2">({totalLessons} lessons)</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        {totalLessons === 0 ? (
                          <p className="text-sm text-muted-foreground pl-4">No lessons in this chapter.</p>
                        ) : (
                          <div className="space-y-6">
                            
                            {/* Chapter Core Progress */}
                            <div>
                              <div className="space-y-2">
                                <div className="hidden sm:flex items-center justify-between px-3 py-1 text-xs font-semibold uppercase text-slate-500">
                                  <div className="w-1/3">Student</div>
                                  <div className="w-1/3 text-center">Chapter Progress</div>
                                  <div className="w-1/3 text-right">Completion Time</div>
                                </div>
                                
                                {enrolledUsers.map(user => {
                                  // Find lessons completed by this user in this chapter
                                  const completedLessons = chap.lessons.filter(l => 
                                    l.lessonProgress.some(lp => lp.userId === user.id && lp.completed)
                                  );
                                  
                                  const pct = totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0;
                                  
                                  // Find the latest activity time for this chapter
                                  let lastTime: Date | null = null;
                                  completedLessons.forEach(l => {
                                    const lp = l.lessonProgress.find(lp => lp.userId === user.id);
                                    if (lp && lp.updatedAt) {
                                      if (!lastTime || new Date(lp.updatedAt) > new Date(lastTime)) {
                                        lastTime = new Date(lp.updatedAt);
                                      }
                                    }
                                  });

                                  return (
                                    <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm gap-4 sm:gap-0">
                                      <div className="flex items-center gap-3 sm:w-1/3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={user.image!} alt={user.name} />
                                          <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium truncate">{user.name}</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-3 sm:w-1/3">
                                        <Progress value={pct} className="h-2 flex-1" />
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-12 text-right">
                                          {completedLessons.length}/{totalLessons}
                                        </span>
                                      </div>
                                      
                                      <div className="sm:w-1/3 sm:text-right text-xs text-muted-foreground flex sm:block items-center gap-2">
                                        {pct === 100 && lastTime ? (
                                          <span className="text-emerald-600 font-medium dark:text-emerald-400">
                                            Completed {(lastTime as Date).toLocaleDateString()}
                                          </span>
                                        ) : pct > 0 && lastTime ? (
                                          <span>Last active {(lastTime as Date).toLocaleDateString()}</span>
                                        ) : (
                                          <span className="text-slate-400">Not started</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Quiz Scores Section nested in Chapter */}
                            {quizzesInChapter.length > 0 && (
                              <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                                <h4 className="font-semibold text-sm mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                  <BrainCircuit className="size-4 text-violet-500" /> Quiz Scores
                                </h4>
                                <div className="space-y-4">
                                  {quizzesInChapter.map(lesson => (
                                    <div key={lesson.id} className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
                                      <h5 className="font-medium text-sm mb-3 underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4">{lesson.title}</h5>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {enrolledUsers.map(user => {
                                          const { score, total } = getUserQuizScore(lesson.quiz, user.id);
                                          const percentage = total > 0 ? (score / total) * 100 : 0;
                                          return (
                                            <div key={user.id} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                              <span className="text-sm font-medium truncate w-1/2">{user.name}</span>
                                              <span className={`text-sm font-bold ${percentage >= 50 ? 'text-emerald-600 dark:text-emerald-400' : percentage > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                                                {score} / {total} <span className="text-[10px] ml-1 opacity-60 font-medium">({Math.round(percentage)}%)</span>
                                              </span>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
