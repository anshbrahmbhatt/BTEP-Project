"use client";

import { LessonContentType } from "@/app/data/course/get-lesson-content";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { BookIcon, CheckCircle, Play, Paperclip, Download } from "lucide-react";
import { useTransition } from "react";
import { markLessonComplete } from "../actions";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/use-confetti";
import { QuizPlayer } from "./QuizPlayer";
import { LessonChatbot } from "@/components/chat/LessonChatbot";
import { Card, CardContent } from "@/components/ui/card";

interface iAppProps {
  data: LessonContentType;
}

export function CourseContent({ data }: iAppProps) {
  const [pending, startTransition] = useTransition();
  const { triggerConfetti } = useConfetti();
  const resourceUrl = useConstructUrl(data.resourceKey || "");

  function VideoPlayer({
    thumbnailKey,
    videoKey,
  }: {
    thumbnailKey: string;
    videoKey: string;
  }) {
    const videoUrl = useConstructUrl(videoKey);
    const thumbnailUrl = useConstructUrl(thumbnailKey);

    if (!videoKey) {
      return (
        <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-2xl flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-800">
          <BookIcon className="size-16 text-slate-400 mx-auto mb-4 opacity-50" />
          <p className="text-slate-500 font-medium">
            This lesson does not have a video yet
          </p>
        </div>
      );
    }

    return (
      <div className="aspect-video bg-black rounded-2xl relative overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800/80 group">
        <video
          className="w-full h-full object-cover"
          controls
          poster={thumbnailUrl}
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl} type="video/ogg" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  function onSubmit() {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        markLessonComplete(data.id, data.Chapter.Course.slug)
      );

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        triggerConfetti();
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }
  function ResourceBlock() {
    if (!data.resourceKey) return null;
    return (
      <Card className="mt-8 border-slate-200/70 bg-white/65 py-0 shadow-sm transition-all hover:shadow-md dark:border-slate-800">
        <CardContent className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-200">
           <Paperclip className="w-5 h-5 text-blue-500" /> Lesson Resources
        </h3>
        <div className="flex items-center justify-between bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg p-3 hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors">
          <div className="flex items-center space-x-3 truncate">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <Download className="size-5" />
            </div>
            <span className="text-sm font-semibold truncate text-slate-700 dark:text-slate-300">
              {data.resourceName || "Attached Resource Document"}
            </span>
          </div>
          <a href={resourceUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 py-2 rounded-md text-sm font-bold transition-all shadow-sm">
            Download
          </a>
        </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col px-4 pb-36 pt-3 sm:px-6">
      {data.type === "QUIZ" && data.quiz ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-4 space-y-4 border-b border-slate-200 pb-8 pt-4 dark:border-slate-800">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
              {data.title}
            </h1>

            {data.description && (
              <div className="text-slate-600 dark:text-slate-400 prose prose-slate max-w-none">
                <RenderDescription json={JSON.parse(data.description)} />
              </div>
            )}

            <ResourceBlock />
          </div>
          <QuizPlayer
            quiz={data.quiz}
            lessonId={data.id}
            slug={data.Chapter.Course.slug}
            isCompleted={data.lessonProgress.length > 0}
          />
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-4 fade-in flex flex-col gap-6 duration-500">
          
          <div className="w-full space-y-5">
            <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
              {data.title}
            </h1>
            <VideoPlayer
              thumbnailKey={data.thumbnailKey ?? ""}
              videoKey={data.videoKey ?? ""}
            />
          </div>

          <div className="flex justify-start">
            {data.lessonProgress.length > 0 ? (
              <Button
                variant="outline"
                className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700 dark:bg-green-900/20 dark:border-green-800/50 rounded-full font-bold px-6 shadow-sm"
              >
                <CheckCircle className="size-5 mr-2 text-green-500" />
                Completed
              </Button>
            ) : (
              <Button onClick={onSubmit} disabled={pending} className="rounded-full bg-slate-900 px-8 font-bold text-white shadow-md transition-transform active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                <CheckCircle className="size-5 mr-2" />
                Mark as Complete
              </Button>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            {data.description && (
              <div className="text-slate-700 dark:text-slate-300 prose prose-lg prose-slate dark:prose-invert max-w-none font-medium leading-relaxed">
                <RenderDescription json={JSON.parse(data.description)} />
              </div>
            )}

            <ResourceBlock />
          </div>
          <LessonChatbot lessonId={data.id} />
        </div>
      )}
    </div>
  );
}
