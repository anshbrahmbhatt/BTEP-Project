import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="relative min-h-screen w-full flex-1" role="status" aria-live="polite" aria-busy="true">
      <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
        <div className="bg-background/80 backdrop-blur-sm p-4 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-500">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="font-semibold tracking-wide text-foreground">Preparing Dashboard...</span>
        </div>
      </div>

      {/* Background Dashboard Skeleton Structure */}
      <div className="opacity-40 pointer-events-none">
        {/* Header Skeleton */}
        <div className="w-full h-80 bg-gradient-to-r from-secondary/50 via-muted/20 to-transparent border-b border-border/50 relative overflow-hidden flex items-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-12 w-[300px] md:w-[450px]" />
              <Skeleton className="h-6 w-[250px] md:w-[350px]" />
            </div>
            
            <div className="flex bg-muted/20 backdrop-blur-md rounded-2xl p-4 gap-8">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-12" />
              </div>
              <div className="w-px h-10 bg-border/50" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col gap-2 mb-8">
            <Skeleton className="h-10 w-[200px]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-3 w-[70%]" />
                  </div>
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-12 border-t border-border/50">
             <div className="flex flex-col gap-2 mb-10">
               <Skeleton className="h-10 w-[250px]" />
               <Skeleton className="h-5 w-[400px]" />
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
               {Array.from({ length: 3 }).map((_, i) => (
                 <div key={i} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                   <Skeleton className="h-48 w-full" />
                   <div className="p-4 space-y-4">
                     <Skeleton className="h-5 w-[85%]" />
                     <Skeleton className="h-4 w-[60%]" />
                     <div className="pt-4 flex items-center justify-between border-t border-border/50">
                       <Skeleton className="h-6 w-16" />
                       <Skeleton className="h-8 w-24 rounded-full" />
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
