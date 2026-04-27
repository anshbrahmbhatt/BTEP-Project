import { ChartAreaInteractive } from "@/components/sidebar/chart-area-interactive";
import { SectionCards } from "@/components/sidebar/section-cards";
import { adminGetEnrollmentStats } from "../data/admin/admin-get-enrollment-stats";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { adminGetRecentCourses } from "../data/admin/admin-get-recent-courses";
import { EmptyState } from "@/components/general/EmptyState";
import {
  AdminCourseCard,
  AdminCourseCardSkeleton,
} from "./courses/_components/AdminCourseCard";
import { Suspense } from "react";
import { Sparkles, Activity, Search, ShieldCheck } from "lucide-react";

export default async function AdminIndexPage() {
  const enrollmentData = await adminGetEnrollmentStats();
  return (
    <div className="w-full flex-1">
      {/* Admin Header Sequence */}
      <div className="bg-gradient-to-r from-red-600/10 via-orange-600/10 to-transparent border-b border-border/50 pb-10 pt-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 mb-2 text-sm font-bold tracking-wide">
              <ShieldCheck className="w-4 h-4" /> ADMIN PORTAL
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 flex items-center gap-3">
              Platform Command <Sparkles className="w-8 h-8 text-yellow-500" />
            </h1>
            <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed">
              Manage operations, analyze traffic streams, and govern your learning ecosystem.
            </p>
          </div>
        </div>
        <div className="absolute top-[-50%] right-[10%] w-[40rem] h-[40rem] bg-orange-500/10 rounded-full blur-3xl -z-10 mix-blend-multiply" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        <div className="mb-10 mt-6 relative">
          <SectionCards />
        </div>

        <div className="mb-16 bg-background/60 rounded-3xl p-1.5 border border-border/50 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />
          <div className="p-4 sm:p-6 bg-background/80 rounded-[1.35rem]">
            <ChartAreaInteractive data={enrollmentData} />
          </div>
        </div>

        <div className="space-y-8 pt-12 border-t border-slate-200 dark:border-slate-800/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <Activity className="w-8 h-8 p-1.5 bg-blue-500/10 text-blue-500 rounded-lg" /> 
              Recent Courses
            </h2>
            <Link
              className={buttonVariants({ variant: "outline", size: "lg", className: "rounded-full font-bold shadow-sm transition-all hover:scale-105 active:scale-95" })}
              href="/admin/courses"
            >
              Browse Library
            </Link>
          </div>

          <Suspense fallback={<RenderRecentCoursesSkeletonLayout />}>
            <RenderRecentCourses />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function RenderRecentCourses() {
  const data = await adminGetRecentCourses();

  if (data.length === 0) {
    return (
      <div className="bg-background border border-dashed rounded-3xl p-4">
        <EmptyState
          buttonText="Create new Course"
          description="You don't have any courses. Create some to see them here"
          title="Your library is empty!"
          href="/admin/courses/create"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
      {data.map((course) => (
        <AdminCourseCard key={course.id} data={course} />
      ))}
    </div>
  );
}

function RenderRecentCoursesSkeletonLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
      {Array.from({ length: 3 }).map((_, index) => (
        <AdminCourseCardSkeleton key={index} />
      ))}
    </div>
  );
}
