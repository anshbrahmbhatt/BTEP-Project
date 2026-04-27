/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { EnrolledCourseType } from "@/app/data/user/get-enrolled-courses";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { useConstructUrl } from "@/hooks/use-construct-url";
import { useCourseProgress } from "@/hooks/use-course-progress";

import Image from "next/image";
import Link from "next/link";

interface iAppProps {
  data: EnrolledCourseType;
}

export function CourseProgressCard({ data }: iAppProps) {
  const thumbnailUrl = useConstructUrl(data.Course.fileKey);
  const { totalLessons, completedLessons, progressPercentage } =
    useCourseProgress({ courseData: data.Course as any });
  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white/40 backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1.5 dark:border-slate-800/80 dark:bg-slate-900/60 w-full">
      <Badge className="absolute top-3 right-3 z-20 backdrop-blur-md bg-white/90 text-slate-900 border-0 shadow-sm font-bold px-3 py-1 dark:bg-black/80 dark:text-white">{data.Course.level}</Badge>

      <div className="w-full relative h-48 sm:h-52 overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Image
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          src={thumbnailUrl}
          alt="Course Thumbnail"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <CardContent className="p-5 flex flex-col flex-grow">
        <Link
          className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
          href={`/dashboard/${data.Course.slug}`}
        >
          {data.Course.title}
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground leading-tight mt-2">
          {data.Course.smallDescription}
        </p>

        <div className="space-y-4 mt-5">
          <div className="flex justify-between items-end mb-2 text-sm">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Overall Progress</p>
            <p className="font-black text-primary text-base">{progressPercentage}%</p>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-2 w-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <p className="text-xs font-medium text-slate-500 mt-2 flex items-center justify-between">
            <span>{completedLessons} of {totalLessons} lessons completed</span>
            {progressPercentage === 100 && <span className="text-green-500 font-bold">Graduated 🎉</span>}
          </p>
        </div>

        <Link
          href={`/dashboard/${data.Course.slug}`}
          className={buttonVariants({ className: "w-full mt-6 rounded-xl font-bold shadow-sm transition-all hover:bg-primary/90" })}
        >
          {progressPercentage === 0 ? "Start Learning" : progressPercentage === 100 ? "Review Course" : "Continue Learning"}
        </Link>
      </CardContent>
    </Card>
  );
}
