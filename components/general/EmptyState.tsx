import { PackageOpen, PlusCircle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "../ui/button";

interface iAppProps {
  title: string;
  description: string;
  buttonText: string;
  href: string;
}

export function EmptyState({
  buttonText,
  description,
  title,
  href,
}: iAppProps) {
  return (
    <section
      aria-live="polite"
      className="flex h-full flex-1 flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 bg-white/40 p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div className="flex size-24 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 mb-6 drop-shadow-sm">
        <PackageOpen className="size-10" />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h2>
      <p className="mb-10 mt-3 max-w-sm text-center text-base font-medium text-slate-500 dark:text-slate-400">
        {description}
      </p>
      <Link href={href} className={buttonVariants({ className: "h-12 rounded-full px-8 font-semibold shadow-sm" })}>
        <PlusCircle className="size-5 mr-2" />
        {buttonText}
      </Link>
    </section>
  );
}
