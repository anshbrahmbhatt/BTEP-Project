import { EmptyState } from "@/components/general/EmptyState";
import { getAllCourses } from "../data/course/get-all-courses";
import { getEnrolledCourses } from "../data/user/get-enrolled-courses";
import { PublicCourseCard } from "../(public)/_components/PublicCourseCard";
import { Card, CardContent } from "@/components/ui/card";

import { CourseProgressCard } from "./_components/CourseProgressCard";
import { requireUser } from "@/app/data/user/require-user";
import { BookOpen, Compass, Sparkles, Trophy, LayoutDashboard } from "lucide-react";

export default async function DashboardPage() {
  const [courses, enrolledCourses, user] = await Promise.all([
    getAllCourses(),
    getEnrolledCourses(),
    requireUser(),
  ]);

  return (
    <div className="w-full flex-1">
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 pb-7 pt-8 shadow-sm sm:px-6 lg:px-8">
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-2 text-sm font-semibold">
              <Sparkles className="w-4 h-4" /> Welcome back, {user.name?.split(" ")[0] || "Learner"}!
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-primary">
              Your Learning Hub
            </h1>
            <p className="text-muted-foreground text-lg font-medium max-w-xl">
              Track your progress, dive into active courses, and discover new skills.
            </p>
          </div>
          
          <div className="grid w-full max-w-sm grid-cols-2 gap-3 md:w-auto">
            <Card className="py-0">
              <CardContent className="px-4 py-3">
                <span className="text-muted-foreground text-sm font-medium">Enrolled</span>
                <span className="mt-1 flex items-center gap-2 text-2xl font-bold">
                  <LayoutDashboard className="w-5 h-5 text-blue-500" /> {enrolledCourses.length}
                </span>
              </CardContent>
            </Card>
            <Card className="py-0">
              <CardContent className="px-4 py-3">
                <span className="text-muted-foreground text-sm font-medium">Completed</span>
                <span className="mt-1 flex items-center gap-2 text-2xl font-bold">
                  <Trophy className="w-5 h-5 text-yellow-500" /> 0
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="absolute right-1/4 top-0 -z-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl mix-blend-multiply" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 mb-8">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2.5">
             <BookOpen className="w-8 h-8 p-1.5 bg-blue-500/10 text-blue-500 rounded-lg" /> 
             Active Courses
          </h2>
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="bg-background border border-dashed rounded-3xl p-2 mb-12">
            <EmptyState
              title="Your learning journey awaits"
              description="You haven't enrolled in any courses yet. Start exploring to build your skills!"
              buttonText="Explore Courses"
              href="/courses"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10 pb-12">
            {enrolledCourses.map((course) => (
              <CourseProgressCard key={course.Course.id} data={course} />
            ))}
          </div>
        )}

        <section className="mt-12 border-t border-slate-200 pt-12 dark:border-slate-800/60">
          <div className="flex flex-col gap-2 mb-10">
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2.5">
              <Compass className="w-8 h-8 p-1.5 bg-purple-500/10 text-purple-500 rounded-lg" /> 
              Recommended For You
            </h2>
            <p className="font-medium text-slate-500 dark:text-slate-400">
              Expand your horizons with these highly-rated modules picked just for you.
            </p>
          </div>

          {courses.filter(
            (course) =>
              !enrolledCourses.some(
                ({ Course: enrolled }) => enrolled.id === course.id
              )
          ).length === 0 ? (
            <div className="bg-background border border-dashed rounded-3xl p-2">
              <EmptyState
                title="You're all caught up!"
                description="You have already purchased all available courses. Stay tuned for new releases."
                buttonText="Review Your Courses"
                href="/dashboard"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10 pb-16">
              {courses
                .filter(
                  (course) =>
                    !enrolledCourses.some(
                      ({ Course: enrolled }) => enrolled.id === course.id
                    )
                )
                .map((course) => (
                  <PublicCourseCard key={course.id} data={course} />
                ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
