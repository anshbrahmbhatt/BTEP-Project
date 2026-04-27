import { adminGetCourses } from "@/app/data/admin/admin-get-courses";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import {
  AdminCourseCard,
  AdminCourseCardSkeleton,
} from "./_components/AdminCourseCard";
import { EmptyState } from "@/components/general/EmptyState";
import { Suspense } from "react";

export default function CoursesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl pb-12 pt-3">
      <div className="mb-10 rounded-2xl border border-border/60 bg-gradient-to-r from-primary/10 to-background p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Admin Courses</h1>
          <Link className={buttonVariants({ className: "rounded-lg px-6 font-semibold shadow-sm" })} href="/admin/courses/create">
            Create New Course
          </Link>
        </div>
        <p className="mt-1 text-base font-medium text-slate-500 dark:text-slate-400">Create, edit, and manage all your learning tracks.</p>
      </div>

      <Suspense fallback={<AdminCourseCardSkeletonLayout />}>
        <RenderCourses />
      </Suspense>
    </div>
  );
}

async function RenderCourses() {
  const data = await adminGetCourses();

  return (
    <>
      {data.length === 0 ? (
        <div className="my-10 border border-dashed border-slate-300 dark:border-slate-800 rounded-[2rem] p-4 text-center">
          <EmptyState
            title="No courses yet"
            description="You haven't built any learning experiences yet. Click to get started!"
            buttonText="Create Your First Course"
            href="/admin/courses/create"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {data.map((course) => (
            <AdminCourseCard key={course.id} data={course} />
          ))}
        </div>
      )}
    </>
  );
}

function AdminCourseCardSkeletonLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
      {Array.from({ length: 3 }).map((_, index) => (
        <AdminCourseCardSkeleton key={index} />
      ))}
    </div>
  );
}
