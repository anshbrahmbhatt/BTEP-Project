import { getAllCourses } from "@/app/data/course/get-all-courses";
import {
  PublicCourseCard,
  PublicCourseCardSkeleton,
} from "../_components/PublicCourseCard";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default function PublicCoursesroute() {
  return (
    <div className="mb-24 w-full flex-1">
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-violet-500/10 px-4 py-14 shadow-sm">
        <div className="absolute -left-[10%] -top-[20%] h-96 w-96 rounded-full bg-blue-500/10 blur-3xl mix-blend-multiply" />
        <div className="absolute -bottom-[20%] -right-[10%] h-[30rem] w-[30rem] rounded-full bg-purple-500/10 blur-3xl mix-blend-multiply" />
        
        <div className="relative mx-auto flex max-w-7xl flex-col items-center space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary mb-2 text-sm font-bold tracking-wide border border-primary/20 shadow-sm backdrop-blur-md">
            <Sparkles className="w-4 h-4" /> BROWSE CATALOG
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Explore Courses
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl px-4">
            Discover our wide range of premium courses designed to help you achieve your career and learning goals.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<LoadingSkeletonLayout />}>
          <RenderCourses />
        </Suspense>
      </div>
    </div>
  );
}

async function RenderCourses() {
  const courses = await getAllCourses();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <PublicCourseCard key={course.id} data={course} />
      ))}
    </div>
  );
}

function LoadingSkeletonLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, index) => (
        <PublicCourseCardSkeleton key={index} />
      ))}
    </div>
  );
}
