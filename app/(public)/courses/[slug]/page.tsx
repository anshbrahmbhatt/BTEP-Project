import { getIndividualCourse } from "@/app/data/course/get-course";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { env } from "@/lib/env";
import {
  IconBook,
  IconCategory,
  IconChartBar,
  IconChevronDown,
  IconClock,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { CheckIcon } from "lucide-react";
import Image from "next/image";
import { checkIfCourseBought } from "@/app/data/user/user-is-enrolled";
import Link from "next/link";
import { EnrollmentButton } from "./_components/EnrollmentButton";
import { buttonVariants } from "@/components/ui/button";

type Params = Promise<{ slug: string }>;

export default async function SlugPage({ params }: { params: Params }) {
  const { slug } = await params;
  const course = await getIndividualCourse(slug);
  const isEnrolled = await checkIfCourseBought(course.id);
  const totalLessons =
    course.chapter.reduce((total, chapter) => total + chapter.lessons.length, 0) || 0;

  return (
    <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="order-1 lg:col-span-2">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/50 shadow-lg">
          <Image
            src={`https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES}.t3.storage.dev/${course.fileKey}`}
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        <div className="mt-8 space-y-7">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              {course.title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed line-clamp-2">
              {course.smallDescription}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Badge className="flex items-center gap-1 px-3 py-1">
              <IconChartBar className="size-4" />
              <span>{course.level}</span>
            </Badge>
            <Badge className="flex items-center gap-1 px-3 py-1">
              <IconCategory className="size-4" />
              <span>{course.category}</span>
            </Badge>
            <Badge className="flex items-center gap-1 px-3 py-1">
              <IconClock className="size-4" />
              <span>{course.duration} hours</span>
            </Badge>
          </div>

          <Separator className="my-7" />

          <div className="space-y-5 rounded-2xl border border-border/60 bg-card/70 p-6">
            <h2 className="text-3xl font-semibold tracking-tight">
              Course Description
            </h2>

            <RenderDescription json={JSON.parse(course.description)} />
          </div>
        </div>

        <div className="mt-12 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-3xl font-semibold tracking-tight">
              Course Content
            </h2>
            <div className="rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-sm text-muted-foreground">
              {course.chapter.length} chapters | {totalLessons} lessons
            </div>
          </div>

          <div className="space-y-4">
            {course.chapter.map((chapter, index) => (
              <Collapsible key={chapter.id} defaultOpen={index === 0}>
                <Card className="gap-0 overflow-hidden border p-0 transition-all duration-200 hover:shadow-md">
                  <CollapsibleTrigger>
                    <div>
                      <CardContent className="p-6 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <p className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                              {index + 1}
                            </p>
                            <div>
                              <h3 className="text-xl font-semibold text-left">
                                {chapter.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1 text-left">
                                {chapter.lessons.length} lesson
                                {chapter.lessons.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">
                              {chapter.lessons.length} lesson
                              {chapter.lessons.length !== 1 ? "s" : ""}
                            </Badge>

                            <IconChevronDown className="size-5 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t bg-muted/20">
                      <div className="p-6 pt-4 space-y-3">
                        {chapter.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-4 rounded-lg p-3 hover:bg-accent transition-colors"
                          >
                            <div className="flex size-8 items-center justify-center rounded-full bg-background border-2 border-primary/20">
                              <IconPlayerPlay className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>

                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {lesson.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Lesson {lessonIndex + 1}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </div>
      </div>

      {/* Enrollment Card */}
      <div className="order-2 lg:col-span-1">
        <div className="sticky top-24">
          <Card className="border-border/60 py-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-medium text-muted-foreground">Price</span>
                <span className="text-2xl font-bold text-primary">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(course.price)}
                </span>
              </div>

              <div className="mb-6 space-y-3 rounded-xl border border-border/70 bg-muted/55 p-4">
                <h4 className="font-medium">What you will get:</h4>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <IconClock className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Course Duration</p>
                      <p className="text-sm text-muted-foreground">
                        {course.duration} hours
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <IconChartBar className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Difficulty Level</p>
                      <p className="text-sm text-muted-foreground">
                        {course.level}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <IconCategory className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Category</p>
                      <p className="text-sm text-muted-foreground">
                        {course.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <IconBook className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Lessons</p>
                      <p className="text-sm text-muted-foreground">
                        {totalLessons} lessons
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6 space-y-3">
                <h4>This course includes:</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                      <CheckIcon className="size-3" />
                    </div>
                    <span>Full lifetime access</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                      <CheckIcon className="size-3" />
                    </div>
                    <span>Access on mobile and desktop</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="rounded-full p-1 bg-green-500/10 text-green-500">
                      <CheckIcon className="size-3" />
                    </div>
                    <span>Certificate of completion</span>
                  </li>
                </ul>
              </div>

              {isEnrolled ? (
                <Link
                  className={buttonVariants({ className: "w-full" })}
                  href="/dashboard"
                >
                  Watch Course
                </Link>
              ) : (
                <EnrollmentButton courseId={course.id} />
              )}

              <p className="mt-3 text-center text-xs text-muted-foreground">
                30-day money-back guarantee
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
