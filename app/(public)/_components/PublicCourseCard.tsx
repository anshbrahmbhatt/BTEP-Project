import { PublicCourseType } from "@/app/data/course/get-all-courses";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { School, TimerIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface iAppProps {
  data: PublicCourseType;
}

export function PublicCourseCard({ data }: iAppProps) {
  const thumbnailUrl = useConstructUrl(data.fileKey);
  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white/40 backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1.5 dark:border-slate-800/80 dark:bg-slate-900/60 w-full">
      <Badge className="absolute top-3 right-3 z-20 backdrop-blur-md bg-white/90 text-slate-900 border-0 shadow-sm font-bold px-3 py-1 dark:bg-black/80 dark:text-white">{data.level}</Badge>

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
          href={`/courses/${data.slug}`}
        >
          {data.title}
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground leading-tight mt-2">
          {data.smallDescription}
        </p>

        <div className="mt-5 flex items-center gap-x-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex items-center gap-x-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
            <TimerIcon className="size-4 text-primary" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{data.duration}h</p>
          </div>
          <div className="flex items-center gap-x-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
            <School className="size-4 text-primary" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-[100px]">{data.category}</p>
          </div>
        </div>

        <Link
          href={`/courses/${data.slug}`}
          className={buttonVariants({ className: "w-full mt-6 rounded-xl font-bold shadow-sm transition-all hover:bg-primary/90" })}
        >
          View Details
        </Link>
      </CardContent>
    </Card>
  );
}

export function PublicCourseCardSkeleton() {
  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white/40 dark:border-slate-800/80 dark:bg-slate-900/60 w-full animate-pulse">
      <div className="absolute top-3 right-3 z-10 flex items-center">
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <div className="w-full relative h-48 sm:h-52 bg-slate-100 dark:bg-slate-800">
        <Skeleton className="w-full h-full" />
      </div>

      <CardContent className="p-5 flex flex-col flex-grow">
        <div className="space-y-3 mt-1">
          <Skeleton className="h-6 w-full rounded-md" />
          <Skeleton className="h-6 w-3/4 rounded-md" />
        </div>

        <div className="mt-6 flex items-center gap-x-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>

        <Skeleton className="mt-6 w-full h-10 rounded-xl" />
      </CardContent>
    </Card>
  );
}
