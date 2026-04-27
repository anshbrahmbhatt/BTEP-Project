import { AdminCourseType } from "@/app/data/admin/admin-get-courses";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useConstructUrl } from "@/hooks/use-construct-url";
import {
  ArrowRight,
  Eye,
  Users,
  MoreVertical,
  Pencil,
  School,
  TimerIcon,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface iAppProps {
  data: AdminCourseType;
}

export function AdminCourseCard({ data }: iAppProps) {
  const thumbnailUrl = useConstructUrl(data.fileKey);
  return (
    <Card className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 dark:border-slate-800/80 dark:bg-slate-900/60">
      <div className="absolute top-3 right-3 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-lg">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/admin/courses/${data.id}/edit`}>
                <Pencil className="size-4 mr-2" />
                Edit Course
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/courses/${data.slug}`}>
                <Eye className="size-4 mr-2" />
                Preview
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/admin/courses/${data.id}/delete`}>
                <Trash2 className="size-4 mr-2 text-destructive" />
                Delete Course
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="w-full relative h-48 sm:h-52 overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Image
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          src={thumbnailUrl}
          alt="Course Thumbnail"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      <CardContent className="p-5 flex flex-col flex-grow">
        <Link
          href={`/admin/courses/${data.id}/edit`}
          className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
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
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-[100px]">{data.level}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            className={buttonVariants({
              className: "w-full rounded-xl font-semibold shadow-sm transition-all",
            })}
            href={`/admin/courses/${data.id}/edit`}
          >
            Manage Course <ArrowRight className="size-4 ml-1.5" />
          </Link>
          <Link
            className={buttonVariants({
              variant: "outline",
              className: "w-full rounded-xl border-blue-200 font-semibold text-blue-600 shadow-sm hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-900/20",
            })}
            href={`/admin/courses/${data.id}/students`}
          >
            <Users className="size-4 mr-1.5" /> Student Data
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminCourseCardSkeleton() {
  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white/40 dark:border-slate-800/80 dark:bg-slate-900/60 w-full animate-pulse">
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <Skeleton className="size-10 rounded-full" />
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
