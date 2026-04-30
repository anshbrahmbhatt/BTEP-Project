"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { submitQuizAnswers } from "../actions";
import { useConfetti } from "@/hooks/use-confetti";
import { useAssessmentTracker } from "@/hooks/use-aiee-tracker";
import { LessonContentType } from "@/app/data/course/get-lesson-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, BrainCircuit, Hash, AlignLeft, Loader2 } from "lucide-react";

interface QuizPlayerProps {
  quiz: NonNullable<LessonContentType["quiz"]>;
  lessonId: string;
  slug: string;
  isCompleted: boolean;
}

export function QuizPlayer({ quiz, lessonId, slug, isCompleted }: QuizPlayerProps) {
  const [pending, startTransition] = useTransition();
  const { triggerConfetti } = useConfetti();
  
  // Track assessment integrity
  useAssessmentTracker(quiz.id);

  // Extract previous answers from the quiz data
  const previousAnswers: Record<string, string[]> = {};
  const previousEvaluations: Record<string, { isCorrect: boolean; feedback?: string }> = {};
  let previouslyScored = 0;

  quiz.questions.forEach(q => {
    if (q.userAnswers && q.userAnswers.length > 0) {
      if (q.type === "NUMERICAL" || q.type === "FILL_IN_THE_BLANK" || q.type === "THEORY") {
        previousAnswers[q.id] = [q.userAnswers[0].textAnswer || ""];
      } else {
        previousAnswers[q.id] = q.userAnswers.map((a: any) => a.selectedOptionId);
      }

      const firstAnswer = q.userAnswers[0] as any;
      if (firstAnswer.isCorrect !== null && firstAnswer.isCorrect !== undefined) {
        previousEvaluations[q.id] = {
          isCorrect: firstAnswer.isCorrect,
          feedback: firstAnswer.feedback || undefined,
        };
        if (firstAnswer.isCorrect) previouslyScored++;
      }
    }
  });

  const hasPreviousAnswers = Object.keys(previousAnswers).length > 0;

  // For mc/ms types, tally local score if no previous server score stored
  if ((isCompleted || hasPreviousAnswers) && previouslyScored === 0) {
    quiz.questions.forEach(q => {
      const selected = previousAnswers[q.id];
      if (!selected) return;
      if (q.type === "MULTIPLE_CHOICE" || q.type === "MULTIPLE_SELECT") {
        const correctOptionIds = q.options.filter(o => o.isCorrect).map(o => o.id);
        const isCorrect =
          selected.length === correctOptionIds.length &&
          selected.every(id => correctOptionIds.includes(id));
        if (isCorrect) previouslyScored++;
      } else if (q.type === "NUMERICAL" || q.type === "FILL_IN_THE_BLANK") {
        const userInput = selected[0]?.trim().toLowerCase() || "";
        const correctOptions = q.options.filter(o => o.isCorrect);
        const isCorrect = correctOptions.some(o => o.text.trim().toLowerCase() === userInput);
        if (isCorrect) previouslyScored++;
      }
    });
  }

  const [answers, setAnswers] = useState<Record<string, string[]>>(
    hasPreviousAnswers ? previousAnswers : {}
  );
  const [score, setScore] = useState<number | null>(
    hasPreviousAnswers ? previouslyScored : null
  );
  const [evaluations, setEvaluations] = useState<
    Record<string, { isCorrect: boolean; feedback?: string }>
  >(hasPreviousAnswers ? previousEvaluations : {});
  const [retryMode, setRetryMode] = useState(false);

  const isSubmitted = (hasPreviousAnswers || score !== null) && !retryMode;

  function handleOptionChange(
    questionId: string,
    optionId: string,
    isSingleSelect = false
  ) {
    if (isSubmitted) return;
    setAnswers(prev => {
      if (isSingleSelect) return { ...prev, [questionId]: [optionId] };
      const current = prev[questionId] || [];
      if (current.includes(optionId)) {
        return { ...prev, [questionId]: current.filter(id => id !== optionId) };
      }
      return { ...prev, [questionId]: [...current, optionId] };
    });
  }

  function handleTextChange(questionId: string, text: string) {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: [text] }));
  }

  function onSubmit() {
    startTransition(async () => {
      const result = await submitQuizAnswers(lessonId, quiz.id, answers, slug);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (result.score !== undefined) {
        setScore(result.score);
        if (result.evaluations) setEvaluations(result.evaluations);
        setRetryMode(false);
        triggerConfetti();
      }
    });
  }

  // ── Question type badge ────────────────────────────────────────────────────
  function TypeBadge({ type }: { type: string }) {
    const map: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
      MULTIPLE_CHOICE: { label: "Multiple Choice", icon: null, color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
      MULTIPLE_SELECT: { label: "Multiple Select", icon: null, color: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
      NUMERICAL: { label: "Numerical", icon: <Hash className="size-3" />, color: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
      FILL_IN_THE_BLANK: { label: "Fill in the Blank", icon: <AlignLeft className="size-3" />, color: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      THEORY: { label: "Theory — AI Graded", icon: <BrainCircuit className="size-3" />, color: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    };
    const info = map[type] ?? { label: type, icon: null, color: "bg-muted text-muted-foreground" };
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${info.color}`}>
        {info.icon}
        {info.label}
      </span>
    );
  }

  const scorePercent =
    score !== null && quiz.questions.length > 0
      ? Math.round((score / quiz.questions.length) * 100)
      : 0;

  return (
    <div className="w-full space-y-6 py-4 md:pr-4">
      {/* ── Pre-submit banner ── */}
      {!isSubmitted && (
        <Alert>
          <AlertTitle>Quiz</AlertTitle>
          <AlertDescription>
            Answer all questions and submit to complete this lesson.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Score card ── */}
      {isSubmitted && (
        <Card className="relative mt-6 overflow-hidden border-primary/30 bg-primary/5 shadow-inner">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-primary"></div>
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col md:flex-row items-center gap-6 justify-center md:justify-start">
              <div className="relative size-24 flex-shrink-0">
                <svg className="size-24 -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/20" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="currentColor" strokeWidth="2.5"
                    strokeDasharray={`${scorePercent} ${100 - scorePercent}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className={scorePercent >= 60 ? "text-green-500 transition-all duration-1000" : "text-red-500 transition-all duration-1000"}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-slate-800 dark:text-slate-100">
                  {scorePercent}%
                </span>
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">Quiz Completed!</h3>
                <p className="text-slate-600 dark:text-slate-300 text-base font-medium">
                  You scored <strong className="text-primary text-xl">{score}</strong> out of <strong className="text-slate-800 dark:text-slate-200">{quiz.questions.length}</strong> questions.
                </p>
                {scorePercent >= 60 ? (
                  <p className="text-green-600 dark:text-green-400 text-sm font-bold mt-2 bg-green-100 dark:bg-green-900/30 inline-block px-3 py-1 rounded-full">Great job! 🎉</p>
                ) : (
                  <p className="text-red-600 dark:text-red-400 text-sm font-bold mt-2 bg-red-100 dark:bg-red-900/30 inline-block px-3 py-1 rounded-full">Keep practising — you've got this! 💪</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Questions ── */}
      <div className="mb-8 mt-10 space-y-8">
        {quiz.questions.map((question, index) => {
          const selectedOption = answers[question.id];
          const evaluation = evaluations[question.id];

          return (
            <Card key={question.id} className={`overflow-hidden rounded-2xl border-slate-200 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 ${isSubmitted && evaluation ? (evaluation.isCorrect ? "border-green-300 bg-green-50/10 dark:border-green-700" : "border-red-300 bg-red-50/10 dark:border-red-700") : ""}`}>
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 dark:border-slate-800/50 dark:bg-slate-900/50">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg md:text-xl font-bold leading-relaxed text-slate-800 dark:text-slate-200">
                    <span className="text-primary mr-1">{index + 1}.</span> {question.questionText}
                  </CardTitle>
                  {isSubmitted && evaluation && (
                    evaluation.isCorrect
                      ? <CheckCircle2 className="size-6 text-green-500 flex-shrink-0 mt-0.5 drop-shadow-sm" />
                      : <XCircle className="size-6 text-red-500 flex-shrink-0 mt-0.5 drop-shadow-sm" />
                  )}
                </div>
                <TypeBadge type={question.type} />
              </CardHeader>
              <CardContent>
                {/* ── Multiple Choice ── */}
                {question.type === "MULTIPLE_CHOICE" && (
                  <div className="space-y-2">
                    {question.options.map(option => {
                      const isSelected = selectedOption?.includes(option.id) || false;
                      let cls = "flex items-center space-x-3 p-3 rounded-md border text-sm transition-colors cursor-pointer";
                      if (isSubmitted) {
                        if (option.isCorrect) cls += " border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400";
                        else if (isSelected) cls += " border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";
                        else cls += " opacity-50";
                      } else {
                        cls += isSelected ? " border-primary bg-primary/5" : " hover:bg-black/5 dark:hover:bg-white/5";
                      }
                      return (
                        <div key={option.id} className={cls} onClick={() => !isSubmitted && !pending && handleOptionChange(question.id, option.id, true)}>
                          <RadioGroup value={isSelected ? option.id : ""} onValueChange={val => handleOptionChange(question.id, val, true)}>
                            <RadioGroupItem value={option.id} id={option.id} disabled={isSubmitted || pending} />
                          </RadioGroup>
                          <Label htmlFor={option.id} className="flex-1 cursor-pointer font-normal">
                            {option.text}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Multiple Select ── */}
                {question.type === "MULTIPLE_SELECT" && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground mb-3">Select all that apply.</p>
                    {question.options.map(option => {
                      const isSelected = selectedOption?.includes(option.id) || false;
                      let cls = "flex items-center space-x-3 p-3 rounded-md border text-sm transition-colors cursor-pointer";
                      if (isSubmitted) {
                        if (option.isCorrect) cls += " border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400";
                        else if (isSelected) cls += " border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";
                        else cls += " opacity-50";
                      } else {
                        cls += isSelected ? " border-primary bg-primary/5" : " hover:bg-black/5 dark:hover:bg-white/5";
                      }
                      return (
                        <div key={option.id} className={cls} onClick={() => !isSubmitted && !pending && handleOptionChange(question.id, option.id, false)}>
                          <Checkbox
                            id={option.id}
                            checked={isSelected}
                            onCheckedChange={() => handleOptionChange(question.id, option.id, false)}
                            disabled={isSubmitted || pending}
                          />
                          <Label htmlFor={option.id} className="flex-1 cursor-pointer font-normal">
                            {option.text}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Numerical ── */}
                {question.type === "NUMERICAL" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Enter a numerical value.</p>
                    <Input
                      placeholder="Enter a number..."
                      type="number"
                      value={selectedOption?.[0] || ""}
                      onChange={e => handleTextChange(question.id, e.target.value)}
                      disabled={isSubmitted || pending}
                      className={`max-w-xs ${isSubmitted ? "font-semibold" : ""}`}
                    />
                    {isSubmitted && (() => {
                      const userInput = selectedOption?.[0]?.trim().toLowerCase() || "";
                      const correctOptions = question.options.filter(o => o.isCorrect);
                      const isCorrect = correctOptions.some(o => o.text.trim().toLowerCase() === userInput);
                      return isCorrect ? (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                          <CheckCircle2 className="size-4" /> Correct!
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium">
                            <XCircle className="size-4" /> Incorrect.
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Correct answer: <strong className="text-foreground">{correctOptions.map(o => o.text).join(" or ")}</strong>
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ── Fill in the Blank ── */}
                {question.type === "FILL_IN_THE_BLANK" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Type the missing word or phrase.</p>
                    <Input
                      placeholder="Fill in the blank..."
                      type="text"
                      value={selectedOption?.[0] || ""}
                      onChange={e => handleTextChange(question.id, e.target.value)}
                      disabled={isSubmitted || pending}
                      className={isSubmitted ? "font-semibold max-w-sm" : "max-w-sm"}
                    />
                    {isSubmitted && (() => {
                      const userInput = selectedOption?.[0]?.trim().toLowerCase() || "";
                      const correctOptions = question.options.filter(o => o.isCorrect);
                      const isCorrect = correctOptions.some(o => o.text.trim().toLowerCase() === userInput);
                      return isCorrect ? (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                          <CheckCircle2 className="size-4" /> Correct!
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium">
                            <XCircle className="size-4" /> Incorrect.
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Correct answer: <strong className="text-foreground">{correctOptions.map(o => o.text).join(" or ")}</strong>
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ── Theory (AI graded) ── */}
                {question.type === "THEORY" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Write a detailed answer. Your response will be evaluated by AI.
                    </p>
                    <Textarea
                      placeholder="Write your answer here..."
                      value={selectedOption?.[0] || ""}
                      onChange={e => handleTextChange(question.id, e.target.value)}
                      disabled={isSubmitted || pending}
                      className={`min-h-[160px] resize-y ${isSubmitted ? "opacity-100" : ""}`}
                    />

                    {/* Pending AI evaluation spinner */}
                    {pending && (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                        <Loader2 className="size-4 animate-spin" />
                        AI is evaluating your answer...
                      </div>
                    )}

                    {/* AI evaluation result */}
                    {isSubmitted && evaluation && (
                      <Alert
                        className={
                          evaluation.isCorrect
                            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        }
                      >
                        <AlertTitle
                          className={`flex items-center gap-2 font-semibold ${
                            evaluation.isCorrect
                              ? "text-green-700 dark:text-green-400"
                              : "text-red-700 dark:text-red-400"
                          }`}
                        >
                          {evaluation.isCorrect ? (
                            <><CheckCircle2 className="size-4" /> AI Verdict: Correct</>
                          ) : (
                            <><XCircle className="size-4" /> AI Verdict: Incorrect</>
                          )}
                        </AlertTitle>
                        <AlertDescription
                          className={`mt-2 text-sm leading-relaxed ${
                            evaluation.isCorrect
                              ? "text-green-700 dark:text-green-400"
                              : "text-red-700 dark:text-red-400"
                          }`}
                        >
                          {evaluation.feedback || (evaluation.isCorrect ? "Great job!" : "Your answer was not entirely correct.")}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* No evaluation yet (e.g. loaded from DB but feedback missing) */}
                    {isSubmitted && !evaluation && (
                      <p className="text-xs text-muted-foreground italic">
                        AI evaluation not available for this answer.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Action buttons ── */}
      <div className="flex justify-center gap-4 border-t border-slate-200 pb-12 pt-8 dark:border-slate-800 md:justify-start">
        {!isSubmitted ? (
          <Button
            onClick={onSubmit}
            disabled={pending || Object.keys(answers).length !== quiz.questions.length}
            className="min-w-[180px] h-12 rounded-full font-bold text-base shadow-md hover:shadow-lg transition-all"
          >
            {pending ? (
              <><Loader2 className="size-5 mr-2 animate-spin" /> Submitting...</>
            ) : (
              "Submit Quiz Responses"
            )}
          </Button>
        ) : (
          <Button variant="outline" className="min-w-[180px] h-12 rounded-full font-bold text-base border-slate-300 dark:border-slate-700" onClick={() => { setRetryMode(true); setAnswers({}); setScore(null); setEvaluations({}); }}>
            Retry Quiz
          </Button>
        )}
      </div>
    </div>
  );
}
