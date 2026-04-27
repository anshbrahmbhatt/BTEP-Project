"use client";

import { AdminLessonType } from "@/app/data/admin/admin-get-lesson";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
import { ArrowLeft, Loader2, PlusCircle, Save, Trash2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useForm, useFieldArray, Control, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Uploader } from "@/components/file-uploader/Uploader";
import { useTransition, useState } from "react";
import { tryCatch } from "@/hooks/try-catch";
import { updateLesson, generateQuizQuestions } from "../actions";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface iAppProps {
  data: AdminLessonType;
  chapterId: string;
  courseId: string;
}

// ─── AI Quiz Generator ─────────────────────────────────────────────────────────

function AiQuizGeneratorModal({ append, courseContext }: { append: (val: any) => void; courseContext?: string }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!topic) {
      toast.error("Please enter a topic.");
      return;
    }
    setLoading(true);
    try {
      const res = await generateQuizQuestions(topic, count, courseContext);
      if (res.status === "error") {
        toast.error(res.message);
      } else if (res.questions && res.questions.length > 0) {
        res.questions.forEach((q: any) => append(q));
        toast.success(`Generated ${res.questions.length} questions!`);
        setOpen(false);
        setTopic("");
        setCount(3);
      }
    } catch (err) {
      toast.error("Failed to generate questions. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300">
          <Sparkles className="size-4 mr-2" /> Auto-Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Quiz Questions with AI</DialogTitle>
          <DialogDescription>
            Enter a topic and the number of questions, and our AI will generate them for you.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Topic / Instructions</p>
            <Input 
              placeholder="e.g. Photosynthesis in plants" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Number of Questions (1-20)</p>
            <Input 
              type="number" 
              min={1} 
              max={20} 
              value={count} 
              onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading || !topic} className="bg-amber-500 hover:bg-amber-600 text-white">
            {loading ? <><Loader2 className="size-4 mr-2 animate-spin" /> Generating...</> : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Type-aware options editor ────────────────────────────────────────────────

function QuestionOptionsEditor({
  control,
  index,
  fields,
  append,
  remove,
}: {
  control: Control<LessonSchemaType>;
  index: number;
  fields: any[];
  append: (val: any) => void;
  remove: (i: number) => void;
}) {
  const questionType = useWatch({
    control,
    name: `questions.${index}.type` as any,
    defaultValue: "MULTIPLE_CHOICE",
  });

  // ── FILL IN THE BLANK ──────────────────────────────────────────────────────
  if (questionType === "FILL_IN_THE_BLANK") {
    return (
      <div className="space-y-2 pl-4 border-l-2 border-primary/30">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Correct Answer
        </p>
        <p className="text-xs text-muted-foreground">
          Enter the exact text the student must type (case-insensitive match).
        </p>
        <FormField
          control={control}
          name={`questions.${index}.options.0.text`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="e.g. photosynthesis" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* always mark as correct */}
        <FormField
          control={control}
          name={`questions.${index}.options.0.isCorrect`}
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <Checkbox checked={true} onCheckedChange={() => field.onChange(true)} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    );
  }

  // ── NUMERICAL ──────────────────────────────────────────────────────────────
  if (questionType === "NUMERICAL") {
    return (
      <div className="space-y-2 pl-4 border-l-2 border-primary/30">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Correct Number
        </p>
        <p className="text-xs text-muted-foreground">
          Enter the exact numerical answer the student must provide.
        </p>
        <FormField
          control={control}
          name={`questions.${index}.options.0.text`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="number" placeholder="e.g. 42" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`questions.${index}.options.0.isCorrect`}
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <Checkbox checked={true} onCheckedChange={() => field.onChange(true)} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    );
  }

  // ── THEORY (AI Graded) ─────────────────────────────────────────────────────
  if (questionType === "THEORY") {
    return (
      <div className="space-y-3 pl-4 border-l-2 border-amber-400/50">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Reference Answer / Rubric
          </p>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            Optional
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Provide a model answer or grading rubric. The AI uses this as a guideline when
          evaluating student responses. Leave blank to let the AI grade based on general knowledge.
        </p>
        <FormField
          control={control}
          name={`questions.${index}.options.0.text`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <textarea
                  {...field}
                  placeholder="e.g. The answer should mention X, Y and Z concepts..."
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`questions.${index}.options.0.isCorrect`}
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <Checkbox checked={true} onCheckedChange={() => field.onChange(true)} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          🤖 This question will be evaluated automatically by AI. Student answers are graded on submission.
        </div>
      </div>
    );
  }

  // ── MULTIPLE CHOICE / MULTIPLE SELECT ──────────────────────────────────────
  return (
    <div className="space-y-3 pl-4 border-l-2 border-primary/30">
      <h5 className="font-medium text-sm text-foreground mb-2">
        {questionType === "MULTIPLE_SELECT"
          ? "Options — check all correct answers"
          : "Options — check the single correct answer"}
      </h5>
      {fields.map((fieldItem, opIndex) => (
        <div
          key={fieldItem.id}
          className="flex gap-4 items-end bg-background p-3 rounded border shadow-sm"
        >
          <FormField
            control={control}
            name={`questions.${index}.options.${opIndex}.text`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-xs">Option {opIndex + 1}</FormLabel>
                <FormControl>
                  <Input placeholder="Option text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`questions.${index}.options.${opIndex}.isCorrect`}
            render={({ field }) => (
              <FormItem className="flex flex-col items-center justify-center mb-1">
                <FormLabel className="text-xs mb-3">Correct?</FormLabel>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mb-1 text-red-500 hover:text-red-700 hover:bg-red-100"
            onClick={() => remove(opIndex)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => append({ text: "", isCorrect: false })}
      >
        <PlusCircle className="size-4 mr-2" /> Add Option
      </Button>
    </div>
  );
}

// ─── Question item wrapper ─────────────────────────────────────────────────────

function QuestionItem({
  control,
  index,
  removeQuestion,
}: {
  control: Control<LessonSchemaType>;
  index: number;
  removeQuestion: (i: number) => void;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${index}.options` as const,
  });

  return (
    <div className="border p-4 rounded-md mb-6 bg-muted/20 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-primary">Question {index + 1}</h4>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => removeQuestion(index)}
        >
          <Trash2 className="size-4 mr-2" /> Delete
        </Button>
      </div>

      <FormField
        control={control}
        name={`questions.${index}.questionText`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Question Text</FormLabel>
            <FormControl>
              <Input placeholder="Enter your question" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`questions.${index}.type` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Question Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value || "MULTIPLE_CHOICE"}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="MULTIPLE_CHOICE">Multiple Choice (Single Correct)</SelectItem>
                <SelectItem value="MULTIPLE_SELECT">Multiple Select (Multiple Correct)</SelectItem>
                <SelectItem value="NUMERICAL">Numerical Answer</SelectItem>
                <SelectItem value="FILL_IN_THE_BLANK">Fill in the Blank</SelectItem>
                <SelectItem value="THEORY">Theory (AI Graded)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <QuestionOptionsEditor
        control={control}
        index={index}
        fields={fields}
        append={append}
        remove={remove}
      />
    </div>
  );
}

// ─── Main LessonForm ──────────────────────────────────────────────────────────

export function LessonForm({ chapterId, data, courseId }: iAppProps) {
  const [pending, startTransition] = useTransition();

  const form = useForm<LessonSchemaType>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: data.title,
      chapterId: chapterId,
      courseId: courseId,
      description: data.description ?? undefined,
      videoKey: data.videoKey ?? undefined,
      thumbnailKey: data.thumbnailKey ?? undefined,
      resourceKey: data.resourceKey ?? undefined,
      resourceName: data.resourceName ?? undefined,
      type: data.type === "QUIZ" ? "QUIZ" : "VIDEO",
      questions: data.quiz?.questions ?? [],
    },
  });

  const lessonType = form.watch("type");

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  function onSubmit(values: LessonSchemaType) {
    startTransition(async () => {
      const savePromise = tryCatch(updateLesson(values, data.id)).then(
        ({ data: result, error }) => {
          if (error) throw new Error("An unexpected error occurred. Please try again.");
          if (result.status === "error") throw new Error(result.message);
          return result.message;
        }
      );

      toast.promise(savePromise, {
        loading: "Saving lesson...",
        success: (msg) => msg ?? "Lesson saved successfully!",
        error: (err) => err?.message ?? "Failed to save the lesson.",
      });

      try {
        await savePromise;
      } catch {
        // error already shown by toast.promise
      }
    });
  }

  return (
    <div className="pb-10">
      <Link
        className={buttonVariants({ variant: "outline", className: "mb-6" })}
        href={`/admin/courses/${courseId}/edit`}
      >
        <ArrowLeft className="size-4 mr-2" />
        <span>Go Back</span>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Lesson Configuration</CardTitle>
          <CardDescription>
            Configure the content and type for this lesson.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Chapter xyz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <RichTextEditor field={field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="VIDEO">Video</SelectItem>
                        <SelectItem value="QUIZ">Quiz</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 border-t">
                <FormField
                  control={form.control}
                  name="resourceKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource / Notes File (Optional)</FormLabel>
                      <FormControl>
                        <Uploader
                          onChange={field.onChange}
                          value={field.value}
                          fileTypeAccepted="file"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Upload a PDF, Zip, or other resource for this lesson.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="resourceName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resource Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Chapter 1 Slides" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Give the resource a custom display name. If left blank, it will show as "Attached Resource".</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {lessonType === "VIDEO" && (
                <div className="space-y-6 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="thumbnailKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thumbnail image</FormLabel>
                        <FormControl>
                          <Uploader
                            fileTypeAccepted="image"
                            onChange={field.onChange}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="videoKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video File</FormLabel>
                        <FormControl>
                          <Uploader
                            onChange={field.onChange}
                            value={field.value}
                            fileTypeAccepted="video"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                     )}
                  />
                </div>
              )}

              {lessonType === "QUIZ" && (
                <div className="mt-6 border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Quiz Questions</h3>
                    <div className="flex items-center gap-2">
                      <AiQuizGeneratorModal 
                        append={append} 
                        courseContext={`Course context: ${form.watch("name")}. Description: ${form.watch("description")}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          append({
                            questionText: "",
                            type: "MULTIPLE_CHOICE",
                            options: [
                              { text: "", isCorrect: true },
                              { text: "", isCorrect: false },
                            ],
                          })
                        }
                      >
                        <PlusCircle className="size-4 mr-2" /> Add Question
                      </Button>
                    </div>
                  </div>

                  {fields.map((field, index) => (
                    <QuestionItem
                      key={field.id}
                      control={form.control}
                      index={index}
                      removeQuestion={remove}
                    />
                  ))}

                  {fields.length === 0 && (
                    <p className="text-muted-foreground text-sm py-4">
                      No questions created yet. Add one to get started.
                    </p>
                  )}
                </div>
              )}

              <Button disabled={pending} type="submit" className="w-full gap-2">
                {pending ? (
                  <><Loader2 className="size-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="size-4" /> Save Lesson</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
